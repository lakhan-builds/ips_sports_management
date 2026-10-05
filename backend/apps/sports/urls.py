from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SportViewSet

router = DefaultRouter()
router.register(r'', SportViewSet, basename='sport')

urlpatterns = [
    path('', include(router.urls)),
]
