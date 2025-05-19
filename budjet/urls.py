from django.contrib import admin
from django.urls import path, include
from predictor.views import initialize_models

initialize_models()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('predictor.urls')),
]
