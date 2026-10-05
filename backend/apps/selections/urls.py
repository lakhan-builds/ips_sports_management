from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentSelectionViewSet

router = DefaultRouter()
router.register(r'', StudentSelectionViewSet, basename='selection')

urlpatterns = [
    path('', include(router.urls)),
]
