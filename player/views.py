import os, time
from pathlib import Path
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, FileResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def index(request):
    return render(request, 'player/index.html')

@login_required
def getMusicList(request):
    arr = recursive_listdir(os.path.join(settings.BASE_DIR, 'file'))
    return JsonResponse(arr, safe=False)

@login_required
def getMusic(request, song):
    song = song.replace('#', '/')
    basePath = str(settings.BASE_DIR)
    musicPath = Path(basePath + '/file/' + song)
    musicName = musicPath.name
    file = open(musicPath, 'rb').read()
    response = HttpResponse(content_type='audio/mpeg')
    response['Content-Disposition'] = 'attachment; filename='+musicName
    response.write(file)
    return response
    # context = {'song':song,'musicPath':Path(musicPath)}
    # return render(request, 'player/get_music.html', context)

def recursive_listdir(path, root='/'):
    dataArr = []
    files = os.listdir(path)
    for file in files:
        file_path = os.path.join(path, file)
        if os.path.isfile(file_path):
            dataArr.append({'title': file, 'dir': root, 'type':'file'})
        elif os.path.isdir(file_path):
          dataArr.append({'title': file, 'dir': root, 'type':'dir'})
          dataArr.extend(recursive_listdir(file_path, root + file if root == '/' else root + '/' + file))
    return dataArr

