from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrialViewSet

router = DefaultRouter()
router.register(r'', TrialViewSet, basename='trial')

urlpatterns = [
    path('', include(router.urls)),
]
