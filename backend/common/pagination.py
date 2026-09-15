from rest_framework.pagination import PageNumberPagination


class StandardPageNumberPagination(PageNumberPagination):
    """Matches the contract: { count, next, previous, results }, page size 20."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
