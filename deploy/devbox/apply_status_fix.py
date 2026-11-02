import hashlib
from pathlib import Path
import argilla_server

target = Path(argilla_server.__file__).parent / 'search_engine' / 'elasticsearch.py'
original = target.read_bytes()
expected = '36087191a08ea426f012376c2acb0d95cb3227f2185765f2d267fbb425cc4f18'
assert hashlib.sha256(original).hexdigest() == expected, 'Unexpected base adapter; review before patching'
old = '    async def info(self) -> dict:\n        return await self.client.info()\n'
new = '    async def info(self) -> dict:\n        return (await self.client.info()).body\n'
text = original.decode()
assert text.count(old) == 1, 'Expected exactly one info method'
target.write_text(text.replace(old, new))
print('Applied Elasticsearch info response-body fix')
