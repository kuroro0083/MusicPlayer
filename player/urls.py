from django.urls import path
from . import views
app_name = 'player'

urlpatterns = [
    path('', views.index, name='index'),
    path('get-music-list', views.getMusicList, name='getMusicList'),
    path('get-music/<str:song>/', views.getMusic, name='getMusic')
]
