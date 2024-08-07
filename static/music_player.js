document.querySelectorAll('button[data-bs-toggle="pill"]').forEach((t,i)=>{
    t.addEventListener('show.bs.tab', function (e) {
        let targetClass = t.dataset.bsTarget
        var pane = document.querySelector('#xf-tab-content '+targetClass)
        var sibling = document.querySelector('#xf-tab-content .tab-pane.active')
        // hide 2nd pane sibling
        sibling.classList.remove('show')
        sibling.classList.remove('active')
        // show 2nd pane
        pane.classList.add('show')
        pane.classList.add('active')
    })  
})



$(document).ready(function(){
    currentDir = '/';
    preDir = ['/'];
    webUrl = '/get-music/';
    audio = $("audio")[0];
    playerStatus = 'pause'; // playing 播放中    pause 暂停 
    playerMod = 'sequence'; // sequence 顺序播放  loop 单曲循环
    musicData = [];
    playList = [];
    toggleRepeatBtn();
    showPlayBtn();
    initKuList();
    initPlayList();

    
    audio.addEventListener('loadstart', function(){renderPlayingTitle('加载中....')});
    audio.addEventListener('canplay', function(){ renderPlayingTitle(playList[findPlayingPosition()].title) });
    
    // $('.xf-btn-test').click(function(){
    //     $.post({
    //         'url' : 'set-play-list',
    //         'data' : {
    //             'list' : JSON.stringify(playList)
    //         },
    //         'success' : function(res){
    //             // console.log(JSON.parse(res.data));
    //         }
    //     });
    // });
    
    // $('.xf-btn-test2').click(function(){
    //     $.get({
    //         'url' : 'get-play-list',
    //         'success' : function(res){
    //             console.log(JSON.parse(res.data));
    //         }
    //     });
    // });


    
    $('.xf-btn-play').click(function(){
        audio.play().catch(function(){showPlayBtn();playFirstSong();console.log('err');});
        showPauseBtn();
    });

    $('.xf-btn-pause').click(function(){
        audio.pause();
        showPlayBtn();
    });
    
    $('.xf-music-bar').on('change', function(){
        console.log('down');
    });

    $('.xf-btn-repeat').click(function(){
        toggleRepeatBtn();
    });

    $('.xf-btn-repeat-1').click(function(){
        toggleRepeatBtn();
    });

    $('.xf-btn-play-next').click(function(){
        playNextSong();
    });

    // ============== listen =================

    $("audio").on('timeupdate', function(){
        audioLen = Math.floor(audio.duration);
        audioNow = Math.floor(audio.currentTime);
        audioNowMMSS = new Date(audioNow * 1000).toISOString().substring(14, 19);
        progressNum = Math.floor(audioNow/audioLen*10000)/100;
        $('.xf-music-time').html(audioNowMMSS);
        $('.xf-music-bar').val(progressNum);
    });

    // 播放完后做什么？
    $("audio").on('ended', function(){
        playNextSong();
    });



    // ============= function ============
    

    function togglePlayBtn()
    {
        playerStatus = playerStatus == 'playing' ? 'pause' : 'playing';
        playerStatus == 'playing' ? showPauseBtn() : showPlayBtn();
    }
    function showPlayBtn(){
        $('.xf-btn-play').show();
        $('.xf-btn-pause').hide();
    }
    function showPauseBtn(){
        $('.xf-btn-play').hide();
        $('.xf-btn-pause').show();
    }

    function toggleRepeatBtn()
    {
        show = $('.xf-btn-repeat-1').css('display');
        if(show == 'none'){
            $('.xf-btn-repeat').hide();
            $('.xf-btn-repeat-1').show();
        }else{
            $('.xf-btn-repeat').show();
            $('.xf-btn-repeat-1').hide();
        }
    }

    function initKuList()
    {
        $.get({
            'url' : 'get-music-list',
            'success' : function(res){
                musicData = res;
                showList(currentDir);
            },
            'fail' : function(){
                alert('获取列表失败，请刷新页面');
            }
        });
    }

    function initPlayList()
    {
        $.get({
            'url' : 'get-play-list',
            'success' : function(res){
                playList = JSON.parse(res.data);
                renderPlayList();
                bindRmoveFromListEvent();
                bindPlayFromList();
            }
        });
    }

    function showList(dir)
    {
        data = getFileList(dir);
        html = '';
        if(dir != '/'){
            html += renderBackBtn();
        }
        for(k in data){
            html += renderTableRow(data[k]);
        }
        $('.xf-tbody-ku').html(html);
        bindMusicRowEvent();
        bindBackEvent();
        bindBtnPlayMusicEvent();
        bindBtnAddMusicEvent();
    }

    // 获取对应路径中的文件夹和文件
    function getFileList(dir)
    {
        data = [];
        for(k in musicData){
            if(musicData[k].type == 'dir' && musicData[k].dir == dir){
                data.push(musicData[k]);
            }
        }
        for(k in musicData){
            if(musicData[k].type == 'file' && musicData[k].dir == dir){
                data.push(musicData[k]);
            }
        }
        return data;
    }


    // ==================== EVENT =================

    // 文件夹点击的事件
    function bindMusicRowEvent(){
        $('.xf-btn-music-folder').on('click',function(){
            f = $(this).attr('data-var');
            preDir.push(currentDir);
            if(currentDir=='/'){
                currentDir = currentDir + f; 
            }else{
                currentDir = currentDir + '/' + f;
            }
            showList(currentDir);
            renderBread();
        });
    }

    function bindBackEvent(){
        $('.xf-btn-music-folder-back').on('click',function(){
            pd = preDir.pop();
            currentDir = pd;
            showList(currentDir);
            renderBread();
        });
    }

    // 音乐库点击播放音乐
    function bindBtnPlayMusicEvent(){
        $('.xf-btn-play-music').on('click',function(){
            mp = $(this).attr('data-var'); // music path
            t = $(this).attr('data-title'); // music title
            playMusic(mp);
            renderPlayingTitle(t);
            showPauseBtn();
            listAddAndPlayNewSong(t, mp); 
        });
    }

    // 添加待播放
    function bindBtnAddMusicEvent(){
        $('.xf-btn-add-music-to-list').on('click',function(){
            t = $(this).attr('data-title');
            u = $(this).attr('data-var');
            if(playList != []){
                ppp = findMusicByUrl(u);
                // 列表中有歌曲，先删除再添加
                if(ppp!=-1){
                    if(playList[ppp].status != 'playing'){
                        removeSong(u);
                    }
                }else{
                    playList.push({ 'title': t, 'url': u, 'status':'waiting' });
                }
                submitPlayList();
                renderPlayList();
                bindRmoveFromListEvent();
                bindPlayFromList();
            }
            
            const toastLiveExample = document.getElementById('liveToast')
            const toast = new bootstrap.Toast(toastLiveExample)
            toast.show()
        });
    }

    function bindRmoveFromListEvent(){
        $('.xf-btn-remove-from-music-list').click(function(){
            removeSong($(this).attr('data-var'));
            renderPlayList();
            bindRmoveFromListEvent();
            bindPlayFromList();
        });
    }

    function bindPlayFromList(){
        $('.xf-btn-play-from-list').click(function(){
            mp = $(this).attr('data-var');
            t = $(this).attr('data-title');
            listChangePlayingToPlayed();
            musicLocation = findMusicByUrl(mp);
            playList[musicLocation].status = 'playing';
            renderPlayList();
            bindRmoveFromListEvent();
            bindPlayFromList();
            playMusic(mp);
            showPauseBtn();
            renderPlayingTitle(playList[musicLocation].title);
        });
    }

    function playMusic(mp){
        m = mp.replace(/\//g, '#');
        src = encodeURIComponent(m);
        fullUrl = webUrl + src + '/';
        audio.src = fullUrl;
        audio.load(); // 重新加载音频元素
        audio.play(); // 播放音频
    }

    function submitPlayList(){
        $.post({
            'url' : 'set-play-list',
            'data' : {
                'list' : JSON.stringify(playList)
            },
            'success' : function(res){
                console.log(JSON.parse(res.data));
            }
        });
    }

    // ===========  操作列表 ============
    // 点击新播放一首曲子
    function listAddAndPlayNewSong(songTitle, songUrl){
        ppp = findMusicByUrl(songUrl);
        // 列表中有歌曲，先删除再添加
        if(ppp!=-1){
            removeSong(songUrl);
        }
        pp = parseInt(findPlayingPosition());
        listChangePlayingToPlayed();
        d = {'title':songTitle, 'url':songUrl, 'status':'playing'};
        playList.splice(pp+1, 0, d);
        submitPlayList();
        renderPlayList();
        bindRmoveFromListEvent();
        bindPlayFromList();
    }

    function listChangePlayingToPlayed(){
        p = findPlayingPosition();
        p != -1 ? playList[p].status = 'played' : '';
    }

    function findMusicByUrl(url){
        p = -1;
        for(i in playList){
            if(playList[i].url == url){ p = i; }
        }
        return p;
    }

    function findPlayingPosition(){
        p = -1;
        for(i in playList){
            if(playList[i].status == 'playing'){
                p = i;
            }
        }
        return p;
    }

    function removeSong(url){
        p = -1;
        for(i in playList){
            if(playList[i].url == url){
                playList.splice(i, 1);
            }
        }
        submitPlayList();
    }

    function playNextSong(){
        pp = parseInt(findPlayingPosition());
        listChangePlayingToPlayed();
        if(playList[pp+1]){
            playList[pp+1].status = 'playing';
            playMusic(playList[pp+1].url);
            renderPlayingTitle(playList[pp+1].title);
        }
        renderPlayList();
        bindRmoveFromListEvent();
        bindPlayFromList();
    }

    function playFirstSong(){
        if(playList.length != 0){
            playMusic(playList[0].url);
            showPauseBtn();
            renderPlayingTitle(playList[0].title);
            playList[0].status = 'playing';
        }
    }

    // ============ render =============
    function renderBackBtn(){
        html = '';
        if(preDir.length != 1){
            i = '<i class="bi bi-arrow-90deg-left"></i>';
            e = '';
            t = '返回上一级';
            html = "<tr class='xf-btn-music-folder-back' data-var='"+preDir[preDir.length - 1]+"'><td>"+i+' '+t+"</td><td class='text-end'>"+e+"</td></tr>"
        }
        return html;
    }

    function renderTableRow(data){
        t = data.title;
        if(data.dir=='/'){
            fp = '/' + data.title;
        }else{
            fp = data.dir + '/' + data.title;
        }
        if(data.type == 'dir'){
            i = '<i class="bi bi-folder"></i>';
            e = ''
            html = "<tr><td class='xf-btn-music-folder' data-var='"+t+"'>"+i+' '+cutMp3FromName(t)+"</td><td class='text-end'>"+e+"</td></tr>"
        }else{
            i = '<i class="bi bi-music-note-beamed"></i>';
            e = '<button class="btn btn-lg xf-btn-play-music" data-var="'+fp+'" data-title="'+data.title+'"><i class="bi bi-play-circle text-primary"></i></button>' + 
            '<button class="btn btn-lg xf-btn-add-music-to-list" data-var="'+fp+'" data-title="'+data.title+'"><i class="bi bi-file-earmark-plus text-danger"></i></button>'
            html = '<tr><td class="xf-btn-play-music" data-var="'+fp+'" data-title="'+data.title+'">'+i+" "+cutMp3FromName(t)+'</td><td class="text-end">'+e+'</td></tr>'
        }
        return html;
    }

    function renderPlayingTitle(t){
        $('.xf-title-music-playing').html(cutMp3FromName(t));
    }

    function renderBread(){
        a = currentDir.split('/');
        html = '';
        for(i in a){
            if(i == 0){
                html += '<li class="breadcrumb-item">首页</li>';
            }else{
                html += a[i]!='' ? '<li class="breadcrumb-item">'+a[i]+'</li>' : '';
            }
        }
        $('.xf-breadcrumb-ku').html(html);
    }

    function renderPlayList(){
        html = '';
        
        for(i in playList){
            t = playList[i].title;
            s = playList[i].status;
            u = playList[i].url;
            mt = '';
            rm = '';
            switch(s){
                case 'playing':
                    mt = '<td class="fs-3 text-primary xf-btn-play-from-list"  data-var="'+u+'" data-title="'+t+'"><i class="bi bi-volume-up text-primary"></i> '+ cutMp3FromName(t) +'</td>';
                    break;
                case 'played':
                    mt = '<td class="fs-5 text-secondary xf-btn-play-from-list" data-var="'+u+'" data-title="'+t+'"> '+ cutMp3FromName(t) +'</td>';
                    rm = '<button class="btn xf-btn-remove-from-music-list" data-var="'+u+'"><i class="bi bi-trash text-danger"></i></button>';
                    break;
                default:
                    mt = '<td class="fs-5 xf-btn-play-from-list" data-var="'+u+'" data-title="'+t+'"> '+ cutMp3FromName(t) +'</td>';
                    rm = '<button class="btn xf-btn-remove-from-music-list" data-var="'+u+'"><i class="bi bi-trash text-danger"></i></button>';
                    break;
            }
            r = '<tr>' + mt + '<td><div class="text-end">' + rm + '</div></td></tr>';
            html += r;
        }
        $('.xf-play-list').html(html);
    }
    
    function cutMp3FromName(mp3){
        return mp3.replace('.mp3','');
    }
})