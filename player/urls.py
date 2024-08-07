from django.urls import path
from . import views
app_name = 'player'

urlpatterns = [
    path('', views.index, name='index'),
    path('get-music-list', views.getMusicList, name='getMusicList'),
    path('get-music/<str:song>/', views.getMusic, name='getMusic'),
    path('get-play-list', views.getPlayList, name='getPlayList'),
    path('set-play-list', views.setPlayList, name='setPlayList'),
]
