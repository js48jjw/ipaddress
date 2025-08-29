// 페이지 로드 시 IP 주소 가져오기
document.addEventListener('DOMContentLoaded', function() {
    getIPAddresses();
    loadBackgroundImage(); // 배경 이미지 로드
    
    // 새로고침 버튼 이벤트 리스너
    document.getElementById('refresh-btn').addEventListener('click', getIPAddresses);
    
    // navbar 클릭 이벤트 리스너
    document.getElementById('home-link').addEventListener('click', function(e) {
        e.preventDefault();
        showHome();
    });
    
    document.getElementById('info-link').addEventListener('click', function(e) {
        e.preventDefault();
        showInfo();
    });
    
    // 테마 전환 버튼 이벤트 리스너
    document.getElementById('theme-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        toggleTheme();
    });
    
    // 정보 화면에서 홈으로 돌아가기 버튼 이벤트 리스너
    document.getElementById('back-to-home').addEventListener('click', function() {
        showHome();
    });
    
    // 복사 버튼 이벤트 리스너 추가
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            copyToClipboard(e.target);
        }
    });
    
    // 저장된 테마 설정 적용
    applySavedTheme();
});

// 홈 화면 표시 함수
function showHome() {
    document.getElementById('home-container').style.display = 'block';
    document.getElementById('info-container').style.display = 'none';
}

// 정보 화면 표시 함수
function showInfo() {
    document.getElementById('home-container').style.display = 'none';
    document.getElementById('info-container').style.display = 'block';
}

// 테마 전환 함수
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (body.classList.contains('dark-theme')) {
        // 어두운 테마에서 밝은 테마로 전환
        body.classList.remove('dark-theme');
        themeToggle.textContent = '테마 밝음';
        // 로컬 스토리지에 테마 설정 저장
        localStorage.setItem('theme', 'light');
    } else {
        // 밝은 테마에서 어두운 테마로 전환
        body.classList.add('dark-theme');
        themeToggle.textContent = '테마 어둠';
        // 로컬 스토리지에 테마 설정 저장
        localStorage.setItem('theme', 'dark');
    }
}

// 저장된 테마 설정 적용 함수
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '테마 어둠';
    } else {
        themeToggle.textContent = '테마 밝음';
    }
}

// IP 주소 가져오기 함수
function getIPAddresses() {
    // 공인 IP 주소 가져오기
    getPublicIP();
    
    // 사설 IP 주소 가져오기
    getPrivateIP();
}

// 공인 IP 주소 가져오기
function getPublicIP() {
    const publicIPElement = document.getElementById('public-ip');
    publicIPElement.textContent = '불러오는 중...';
    publicIPElement.className = 'loading';
    
    // 공인 IP를 가져오기 위한 API 호출
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            publicIPElement.textContent = data.ip;
            publicIPElement.className = '';
        })
        .catch(error => {
            console.error('공인 IP 주소를 가져오는 중 오류 발생:', error);
            publicIPElement.textContent = '오류 발생';
            publicIPElement.className = 'error';
        });
}

// 사설 IP 주소 가져오기
function getPrivateIP() {
    const privateIPElement = document.getElementById('private-ip');
    privateIPElement.textContent = '불러오는 중...';
    privateIPElement.className = 'loading';
    
    // WebRTC를 사용하여 사설 IP 주소 가져오기 (대체 방식 포함)
    try {
        const pc = new RTCPeerConnection({
            iceServers: []
        });
        
        pc.createDataChannel('');
        
        pc.onicecandidate = function(ice) {
            if (!ice || !ice.candidate || !ice.candidate.candidate) return;
            
            const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
            
            if (isPrivateIP(myIP)) {
                privateIPElement.textContent = myIP;
                privateIPElement.className = '';
            }
            
            pc.close();
        };
        
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(error => {
                console.error('WebRTC 방식 오류:', error);
                // 대체 방식 사용
                getPrivateIPFallback(privateIPElement);
            });
            
        // 타임아웃 설정
        setTimeout(() => {
            if (privateIPElement.textContent === '불러오는 중...') {
                getPrivateIPFallback(privateIPElement);
            }
        }, 3000);
    } catch (error) {
        console.error('WebRTC 초기화 오류:', error);
        // 대체 방식 사용
        getPrivateIPFallback(privateIPElement);
    }
}

// 사설 IP 주소 가져오기 대체 방식
function getPrivateIPFallback(element) {
    try {
        // 내부 IP 주소를 가져오기 위한 대체 방법
        const pc = new (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)({
            iceServers: []
        });
        
        if (!pc) {
            throw new Error('RTCPeerConnection not supported');
        }
        
        pc.createDataChannel('');
        pc.onicecandidate = function(ice) {
            if (!ice || !ice.candidate || !ice.candidate.candidate) return;
            const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
            if (myIP && isPrivateIP(myIP)) {
                element.textContent = myIP;
                element.className = '';
                pc.close();
            }
        };
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        // 여전히 실패하면 로컬 주소 표시
        setTimeout(() => {
            if (element.textContent === '불러오는 중...') {
                element.textContent = '127.0.0.1 (local)';
                element.className = '';
            }
        }, 2000);
    } catch (error) {
        console.error('대체 방식 오류:', error);
        element.textContent = '알 수 없음';
        element.className = 'error';
    }
}

// 사설 IP 주소인지 확인하는 함수
function isPrivateIP(ip) {
    // IPv4 사설 주소 범위
    const privateIPv4Ranges = [
        /^10\./,                    // 10.0.0.0 - 10.255.255.255
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0 - 172.31.255.255
        /^192\.168\./               // 192.168.0.0 - 192.168.255.255
    ];
    
    // IPv6 로컬 주소
    const localIPv6 = /^::1$|^fe80::/i;
    
    // 루프백 주소
    const loopback = /^127\./;
    
    return privateIPv4Ranges.some(range => range.test(ip)) || 
           localIPv6.test(ip) || 
           loopback.test(ip);
}

// 클립보드에 복사하는 함수
function copyToClipboard(button) {
    const targetId = button.getAttribute('data-target');
    const targetElement = document.getElementById(targetId);
    const textToCopy = targetElement.textContent;
    
    // 복사할 텍스트가 유효한지 확인
    if (!textToCopy || textToCopy === '불러오는 중...' || textToCopy === '오류 발생' || textToCopy === '알 수 없음') {
        alert('복사할 IP 주소가 없습니다.');
        return;
    }
    
    // Clipboard API를 사용하여 복사
    if (navigator.clipboard && window.isSecureContext) {
        // navigator.clipboard를 사용하는 최신 방법
        navigator.clipboard.writeText(textToCopy).then(() => {
            // 복사 성공 시 버튼 스타일 변경
            showCopyFeedback(button, '복사됨');
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            // 대체 방법 사용
            fallbackCopyTextToClipboard(textToCopy, button);
        });
    } else {
        // 대체 방법 사용 (구형 브라우저용)
        fallbackCopyTextToClipboard(textToCopy, button);
    }
}

// 대체 방법으로 클립보드에 복사하는 함수
function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // 텍스트 영역을 화면 밖으로 이동
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyFeedback(button, '복사됨');
        } else {
            alert('복사에 실패했습니다.');
        }
    } catch (err) {
        console.error('복사 명령 실패:', err);
        alert('복사에 실패했습니다.');
    }
    
    document.body.removeChild(textArea);
}

// 복사 버튼에 피드백을 표시하는 함수
function showCopyFeedback(button, text) {
    const originalText = button.textContent;
    button.textContent = text;
    button.classList.add('copied');
    
    // 2초 후에 원래 상태로 복원
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
    }, 2000);
}

// 배경 이미지 가져오기 (어두운 사진으로)
function loadBackgroundImage() {
    const body = document.body;
    
    // 로컬 스토리지에서 마지막 업데이트 시간 확인
    const lastUpdate = localStorage.getItem('backgroundLastUpdate');
    const cachedImage = localStorage.getItem('backgroundImage');
    const now = new Date();
    
    // 오늘 이미지를 이미 가져왔는지 확인 (매일 오전 6시 기준)
    if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        
        // 마지막 업데이트 날짜의 오전 6시 생성
        const lastUpdateMorning = new Date(lastUpdateDate);
        lastUpdateMorning.setHours(6, 0, 0, 0);
        
        // 현재 시간의 오전 6시 생성
        const todayMorning = new Date(now);
        todayMorning.setHours(6, 0, 0, 0);
        
        // 마지막 업데이트가 오늘 오전 6시 이후이고, 현재 시간이 오늘 오전 6시 이후인 경우
        if (lastUpdateDate >= todayMorning) {
            // 캐시된 이미지가 있으면 사용
            if (cachedImage) {
                body.style.setProperty('--background-image', `url(${cachedImage})`);
                return;
            }
        }
    }
    
    // Picsum Photos를 사용하여 어두운 랜덤 이미지 가져오기
    // filter 파라미터를 사용하여 어두운 이미지 요청
    const imageUrl = `https://picsum.photos/1600/900?random=${Date.now()}&grayscale&blur=2`;
    
    // 이미지 프리로드
    const img = new Image();
    img.onload = function() {
        body.style.setProperty('--background-image', `url(${imageUrl})`);
        // 로컬 스토리지에 저장
        localStorage.setItem('backgroundImage', imageUrl);
        localStorage.setItem('backgroundLastUpdate', now.toISOString());
    };
    
    // 이미지 로딩 실패 시 대체 이미지 설정
    img.onerror = function() {
        console.error('배경 이미지 로딩 실패, 대체 이미지로 변경');
        // 대체 이미지로 그라데이션만 사용
        body.style.setProperty('--background-image', 'none');
    };
    
    img.src = imageUrl;
}