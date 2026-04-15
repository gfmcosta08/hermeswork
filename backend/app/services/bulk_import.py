import json
import pandas as pd
from io import BytesIO, StringIO
from typing import List, Dict, Any, Optional
from decimal import Decimal
import re


class BulkImportService:
    def __init__(self):
        self.results = {
            "created": 0,
            "updated": 0,
            "errors": 0,
            "items": [],
            "error_details": []
        }

    def parse_excel(self, content: bytes) -> List[Dict]:
        try:
            df = pd.read_excel(BytesIO(content), engine='openpyxl')
            return self._df_to_list(df)
        except Exception as e:
            try:
                df = pd.read_excel(BytesIO(content), engine='xlrd')
                return self._df_to_list(df)
            except:
                raise ValueError(f"Erro ao ler Excel: {str(e)}")

    def parse_csv(self, content: bytes) -> List[Dict]:
        try:
            df = pd.read_csv(BytesIO(content))
            return self._df_to_list(df)
        except Exception as e:
            raise ValueError(f"Erro ao ler CSV: {str(e)}")

    def _df_to_list(self, df: pd.DataFrame) -> List[Dict]:
        df = df.fillna("")
        records = df.to_dict('records')
        return [self._normalize_record(r) for r in records]

    def _normalize_record(self, record: Dict) -> Dict:
        normalized = {}
        for key, value in record.items():
            new_key = self._normalize_key(str(key))
            normalized[new_key] = self._normalize_value(value)
        return normalized

    def _normalize_key(self, key: str) -> str:
        key = key.lower().strip()
        key = re.sub(r'[^\w\s]', '', key)
        key = re.sub(r'\s+', '_', key)
        return key

    def _normalize_value(self, value: Any) -> Any:
        if pd.isna(value) or value == "":
            return None
        if isinstance(value, (int, float)):
            return float(value)
        value = str(value).strip()
        if value.lower() in ['true', 'sim', 'yes', 's']:
            return True
        if value.lower() in ['false', 'nao', 'não', 'no', 'n']:
            return False
        return value

    def parse_json(self, content: bytes) -> List[Dict]:
        try:
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, dict):
                data = [data]
            return [self._normalize_record(r) if isinstance(r, dict) else r for r in data]
        except Exception as e:
            raise ValueError(f"Erro ao ler JSON: {str(e)}")

    def extract_products_from_text(self, text: str) -> List[Dict]:
        products = []
        lines = text.split('\n')
        current_product = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            price_match = re.search(r'R\$\s*([\d.,]+)', line, re.IGNORECASE)
            if price_match:
                price_str = price_match.group(1).replace('.', '').replace(',', '.')
                current_product['price'] = float(price_str)

            name_match = re.search(r'^\d+[.\)]\s*(.+?)(?:\s+R\${0,1})', line)
            if name_match:
                if current_product:
                    products.append(current_product)
                current_product = {'name': name_match.group(1).strip()}

            if any(kw in line.lower() for kw in ['kg', 'un', 'litro', 'pacote', 'metro']):
                unit_match = re.search(r'(\d+)\s*(kg|un|litro|pacote|metro)', line, re.IGNORECASE)
                if unit_match:
                    current_product['quantity'] = float(unit_match.group(1))
                    current_product['unit'] = unit_match.group(2).lower()

        if current_product:
            products.append(current_product)

        return products

    def map_to_product(self, record: Dict) -> Dict:
        name = record.get('name') or record.get('produto') or record.get('item') or record.get('descricao')
        if not name:
            return None

        product = {
            'name': str(name),
            'type': 'produto_estoque',
            'price': Decimal(str(record.get('price') or record.get('preco') or record.get('valor') or 0)),
            'category': record.get('category') or record.get('categoria'),
            'unit': record.get('unit') or record.get('unidade') or record.get('un'),
        }

        if record.get('quantity') or record.get('quantidade'):
            product['has_inventory_link'] = True

        desc = record.get('description') or record.get('descricao') or record.get('observacao')
        if desc:
            product['description'] = str(desc)

        metadata = {}
        for key, value in record.items():
            if key not in ['name', 'price', 'preco', 'valor', 'category', 'categoria', 'unit', 'unidade', 'un', 'quantity', 'quantidade', 'description', 'descricao', 'observacao']:
                if value is not None:
                    metadata[key] = value
        if metadata:
            product['metadata'] = metadata

        return product

    def map_to_inventory(self, record: Dict) -> Dict:
        name = record.get('name') or record.get('produto') or record.get('item')
        if not name:
            return None

        inventory = {
            'name': str(name),
            'quantity': Decimal(str(record.get('quantity') or record.get('quantidade') or 0)),
            'purchase_price': Decimal(str(record.get('purchase_price') or record.get('preco_compra') or record.get('custo') or 0)),
            'unit': record.get('unit') or record.get('unidade') or record.get('un'),
            'min_threshold': Decimal(str(record.get('min_threshold') or record.get('estoque_minimo') or record.get('minimo') or 0)),
        }

        location = record.get('location') or record.get('local') or record.get('localizacao')
        if location:
            inventory['location'] = str(location)

        return inventory

    def map_to_contact(self, record: Dict) -> Optional[Dict]:
        name = record.get('name') or record.get('nome') or record.get('cliente') or record.get('fornecedor')
        whatsapp = record.get('whatsapp') or record.get('telefone') or record.get('phone') or record.get('fone')

        if not name and not whatsapp:
            return None

        contact = {
            'type': record.get('type') or record.get('tipo') or 'cliente',
        }

        if name:
            contact['name'] = str(name)
        if whatsapp:
            contact['whatsapp_number'] = re.sub(r'[^\d]', '', str(whatsapp))

        return contact

    def preview_import(self, content: bytes, filename: str, import_type: str = "products") -> Dict:
        ext = filename.lower().split('.')[-1]

        if ext in ['xlsx', 'xls']:
            records = self.parse_excel(content)
        elif ext == 'csv':
            records = self.parse_csv(content)
        elif ext == 'json':
            records = self.parse_json(content)
        else:
            return {"error": f"Formato não suportado: {ext}"}

        mapped = []
        for record in records[:10]:
            if import_type == "products":
                item = self.map_to_product(record)
            elif import_type == "inventory":
                item = self.map_to_inventory(record)
            elif import_type == "contacts":
                item = self.map_to_contact(record)
            else:
                item = record

            if item:
                mapped.append(item)

        return {
            "total_records": len(records),
            "preview": mapped,
            "preview_count": min(10, len(records))
        }
