import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from elastic_transport import ApiResponseMeta, HttpHeaders, NodeConfig, ObjectApiResponse
from argilla_server.api.schemas.v1.info import Status
from argilla_server.search_engine.elasticsearch import ElasticSearchEngine


class StatusResponseRegression(unittest.TestCase):
    def test_elasticsearch_info_passes_status_validation(self):
        body = {'name': 'regression-node', 'version': {'number': '8.17.0'}}
        response = ObjectApiResponse(body, ApiResponseMeta(
            status=200, http_version='1.1', headers=HttpHeaders(), duration=0,
            node=NodeConfig('http', 'localhost', 9200)))
        engine = ElasticSearchEngine.__new__(ElasticSearchEngine)
        engine.client = SimpleNamespace(info=AsyncMock(return_value=response))
        info = asyncio.run(engine.info())
        self.assertIsInstance(info, dict)
        self.assertEqual(info, body)
        status = Status(version='2.8.0', search_engine=info, memory={})
        self.assertEqual(status.search_engine, body)


if __name__ == '__main__':
    unittest.main()
