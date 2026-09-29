// Multi-layer obfuscated API key
// Note: This is obfuscation, NOT encryption. Determined users can still find it.
const _0x4e2a = ['QUl6YVN5Qjly', 'VzFHZ2NRbEJC', 'Y1pxTF94T0pf', 'MG04amFIMkRF', 'RlVz'];
const _k = () => {
    let _t = '';
    for(let i = 0; i < _0x4e2a.length; i++) {
        _t += atob(_0x4e2a[i]);
    }
    return _t;
};
const API_KEY = _k();
const PARTS = 'snippet,statistics,brandingSettings,contentDetails';

// ---------- Element refs ----------
const channelInput = document.getElementById('channelId');
const searchBtn = document.getElementById('fetchButton');
const clearBtn = document.getElementById('clearBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const channelInfo = document.getElementById('channelInfo');
const emptyState = document.getElementById('emptyState');

// ---------- Theme ----------
const themeToggle = document.getElementById('themeToggle');
function syncThemeIcon() {
    themeToggle.innerHTML = document.documentElement.classList.contains('dark')
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
}
themeToggle.addEventListener('click', function() {
    document.documentElement.classList.toggle('dark');
    try {
        localStorage.setItem('statstube-theme',
            document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    } catch (e) {}
    syncThemeIcon();
});
syncThemeIcon();

// ---------- Search events ----------
searchBtn.addEventListener('click', fetchChannelData);
channelInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') fetchChannelData();
});
channelInput.addEventListener('input', function() {
    clearBtn.style.display = this.value.trim() !== '' ? 'flex' : 'none';
});
clearBtn.addEventListener('click', function() {
    channelInput.value = '';
    this.style.display = 'none';
    channelInput.focus();
});

// ---------- Actions ----------
document.getElementById('shareBtn').addEventListener('click', shareStats);
document.getElementById('copyStatsBtn').addEventListener('click', copyStats);
document.getElementById('copyHandleBtn').addEventListener('click', function() {
    copyToClipboard(document.getElementById('channelHandle').textContent);
});
document.getElementById('copyIdBtn').addEventListener('click', function() {
    copyToClipboard(document.getElementById('detailId').textContent);
});
document.getElementById('descToggle').addEventListener('click', function() {
    const desc = document.getElementById('channelDescription');
    const expanded = desc.classList.toggle('expanded');
    this.textContent = expanded ? 'Show less' : 'Show more';
});

// ---------- Recent searches ----------
function getRecent() {
    try {
        return JSON.parse(localStorage.getItem('statstube-recent') || '[]');
    } catch (e) {
        return [];
    }
}

function saveRecent(term) {
    if (!term) return;
    let recent = getRecent().filter(t => t.toLowerCase() !== term.toLowerCase());
    recent.unshift(term);
    recent = recent.slice(0, 6);
    try {
        localStorage.setItem('statstube-recent', JSON.stringify(recent));
    } catch (e) {}
    renderRecent();
}

function renderRecent() {
    const wrap = document.getElementById('recentSearches');
    const chips = document.getElementById('recentChips');
    const recent = getRecent();
    chips.innerHTML = '';
    if (!recent.length) {
        wrap.style.display = 'none';
        return;
    }
    wrap.style.display = 'block';
    recent.forEach(term => {
        const b = document.createElement('button');
        b.className = 'recent-chip';
        b.type = 'button';
        const icon = document.createElement('i');
        icon.className = 'fas fa-history';
        b.appendChild(icon);
        b.appendChild(document.createTextNode(' ' + term));
        b.addEventListener('click', function() {
            channelInput.value = term;
            clearBtn.style.display = 'flex';
            fetchChannelData();
        });
        chips.appendChild(b);
    });
}

renderRecent();

// ---------- Fetch flow ----------
function fetchChannelData() {
    const input = channelInput.value.trim();

    errorMessage.style.display = 'none';
    channelInfo.style.display = 'none';

    if (!input) {
        showError('Please enter a channel ID, username or URL');
        return;
    }

    searchBtn.disabled = true;
    loading.style.display = 'block';
    emptyState.style.display = 'none';

    let channelId = input;
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
        channelId = extractChannelFromUrl(input);
        if (!channelId) {
            loading.style.display = 'none';
            searchBtn.disabled = false;
            showError('Invalid YouTube URL format');
            return;
        }
    }

    fetch(`https://www.googleapis.com/youtube/v3/channels?part=${PARTS}&id=${channelId}&key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                displayChannelInfo(data.items[0]);
            } else {
                return fetch(`https://www.googleapis.com/youtube/v3/channels?part=${PARTS}&forUsername=${channelId}&key=${API_KEY}`)
                    .then(response => response.json())
                    .then(usernameData => {
                        if (usernameData.items && usernameData.items.length > 0) {
                            displayChannelInfo(usernameData.items[0]);
                        } else {
                            return fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${channelId}&type=channel&key=${API_KEY}`)
                                .then(response => response.json())
                                .then(searchData => {
                                    if (searchData.items && searchData.items.length > 0) {
                                        const channelIdFromSearch = searchData.items[0].id.channelId;
                                        return fetch(`https://www.googleapis.com/youtube/v3/channels?part=${PARTS}&id=${channelIdFromSearch}&key=${API_KEY}`)
                                            .then(response => response.json())
                                            .then(channelData => {
                                                if (channelData.items && channelData.items.length > 0) {
                                                    displayChannelInfo(channelData.items[0]);
                                                } else {
                                                    showError('Channel not found');
                                                }
                                            });
                                    } else {
                                        showError('Channel not found');
                                    }
                                });
                        }
                    });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred while fetching channel data');
        })
        .finally(() => {
            searchBtn.disabled = false;
            loading.style.display = 'none';
        });
}

function extractChannelFromUrl(url) {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const pathname = urlObj.pathname;

        if (pathname.includes('/channel/')) {
            const parts = pathname.split('/');
            return parts[parts.indexOf('channel') + 1];
        } else if (pathname.includes('/c/')) {
            const parts = pathname.split('/');
            return parts[parts.indexOf('c') + 1];
        } else if (pathname.includes('/@')) {
            const parts = pathname.split('/');
            const handle = parts[parts.length - 1];
            return handle.startsWith('@') ? handle.substring(1) : handle;
        } else if (pathname.includes('/user/')) {
            const parts = pathname.split('/');
            return parts[parts.indexOf('user') + 1];
        }

        return null;
    } catch (e) {
        return null;
    }
}

// ---------- Display ----------
function displayChannelInfo(channel) {
    const snip = channel.snippet || {};
    const stats = channel.statistics || {};

    // Banner
    const banner = document.getElementById('channelBanner');
    const bannerUrl = channel.brandingSettings && channel.brandingSettings.image &&
        channel.brandingSettings.image.bannerExternalUrl;
    if (bannerUrl) {
        banner.style.backgroundImage = `url("${bannerUrl}")`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
        banner.style.backgroundImage = 'none';
    }

    // Identity
    const avatar = document.getElementById('channelAvatar');
    if (snip.thumbnails && snip.thumbnails.medium) {
        avatar.innerHTML = '';
        const img = document.createElement('img');
        img.src = snip.thumbnails.medium.url;
        img.alt = snip.title || 'Channel avatar';
        avatar.appendChild(img);
    } else {
        avatar.innerHTML = '<i class="fas fa-user-circle"></i>';
    }

    document.getElementById('channelName').textContent = snip.title || 'Unknown channel';

    let handle = snip.customUrl || channel.id;
    const handleText = handle.startsWith('@') ? handle : `@${handle}`;
    document.getElementById('channelHandle').textContent = handleText;

    document.getElementById('visitChannelBtn').href =
        `https://www.youtube.com/channel/${channel.id}`;

    // Update input with handle for easy re-search
    channelInput.value = handleText;
    clearBtn.style.display = 'flex';

    // Core stats
    const subs = parseInt(stats.subscriberCount || '0', 10);
    const views = parseInt(stats.viewCount || '0', 10);
    const videos = parseInt(stats.videoCount || '0', 10);

    document.getElementById('statSubs').textContent = formatSubscriberCount(subs);
    document.getElementById('statViews').textContent = formatNumber(views);
    document.getElementById('statVideos').textContent = formatNumber(videos);

    // Milestone progress
    const msWrap = document.getElementById('milestoneWrap');
    const ms = nextMilestone(subs);
    if (ms) {
        msWrap.style.display = 'block';
        const pct = Math.min(100, (subs / ms) * 100);
        document.getElementById('milestoneLabel').innerHTML = '';
        const label = document.getElementById('milestoneLabel');
        const strong = document.createElement('strong');
        strong.textContent = `${formatNumber(subs)} of ${formatNumber(ms)}`;
        label.appendChild(strong);
        label.appendChild(document.createTextNode(` subscribers · ${formatNumber(ms - subs)} to go`));
        requestAnimationFrame(() => {
            document.getElementById('milestoneFill').style.width = pct + '%';
        });
    } else {
        msWrap.style.display = 'none';
    }

    // Details
    document.getElementById('detailCountry').textContent = snip.country || 'Not specified';

    let monthsOld = 0;
    if (snip.publishedAt) {
        const publishedDate = new Date(snip.publishedAt);
        document.getElementById('detailJoined').textContent = formatDate(publishedDate);
        const diffDays = Math.ceil(Math.abs(Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        document.getElementById('detailAge').textContent = `${years}y ${months}m`;
        monthsOld = Math.max(1, Math.round(diffDays / 30.44));
    } else {
        document.getElementById('detailJoined').textContent = 'Not available';
        document.getElementById('detailAge').textContent = 'Not available';
    }

    document.getElementById('detailAvgViews').textContent =
        formatNumber(videos > 0 ? Math.round(views / videos) : 0);
    document.getElementById('detailViewsPerSub').textContent =
        subs > 0 ? (views / subs).toFixed(1) : '—';
    document.getElementById('detailVideosPerMonth').textContent =
        monthsOld > 0 ? (videos / monthsOld).toFixed(1) : '—';
    document.getElementById('detailId').textContent = channel.id;

    // Keywords
    const tagsBlock = document.getElementById('tagsBlock');
    const tagsBox = document.getElementById('channelTags');
    tagsBox.innerHTML = '';
    const keywords = channel.brandingSettings && channel.brandingSettings.channel &&
        channel.brandingSettings.channel.keywords;
    if (keywords) {
        tagsBlock.style.display = 'block';
        keywords.split(',').slice(0, 10).forEach(kw => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = kw.trim();
            tagsBox.appendChild(tag);
        });
    } else {
        tagsBlock.style.display = 'none';
    }

    // Description with expand toggle
    const desc = document.getElementById('channelDescription');
    const descToggle = document.getElementById('descToggle');
    desc.textContent = snip.description || 'No description available.';
    desc.classList.remove('expanded');
    if (desc.textContent.length > 180) {
        descToggle.style.display = '';
        descToggle.textContent = 'Show more';
    } else {
        descToggle.style.display = 'none';
    }

    saveRecent(handleText);

    channelInfo.style.display = 'block';
    emptyState.style.display = 'none';

    fetchLatestVideos(channel);
}

// ---------- Latest videos ----------
function fetchLatestVideos(channel) {
    const section = document.getElementById('latestSection');
    const grid = document.getElementById('latestVideos');
    section.style.display = 'none';
    grid.innerHTML = '';

    const uploadsId = channel.contentDetails && channel.contentDetails.relatedPlaylists &&
        channel.contentDetails.relatedPlaylists.uploads;
    if (!uploadsId) return;

    document.getElementById('seeAllVideos').href =
        `https://www.youtube.com/channel/${channel.id}/videos`;

    fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=8&key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (!data.items || !data.items.length) return;
            let shown = 0;
            data.items.forEach(item => {
                const s = item.snippet || {};
                if (!s.resourceId || s.title === 'Private video' || s.title === 'Deleted video') return;
                const a = document.createElement('a');
                a.className = 'video-card';
                a.href = `https://www.youtube.com/watch?v=${s.resourceId.videoId}`;
                a.target = '_blank';
                a.rel = 'noopener';

                const thumbWrap = document.createElement('div');
                thumbWrap.className = 'video-thumb';
                const img = document.createElement('img');
                img.loading = 'lazy';
                img.alt = '';
                img.src = (s.thumbnails && (s.thumbnails.medium || s.thumbnails.default) || {}).url || '';
                thumbWrap.appendChild(img);

                const title = document.createElement('div');
                title.className = 'video-title';
                title.textContent = s.title;

                const date = document.createElement('div');
                date.className = 'video-date';
                date.textContent = s.publishedAt ? formatDate(new Date(s.publishedAt)) : '';

                a.appendChild(thumbWrap);
                a.appendChild(title);
                a.appendChild(date);
                grid.appendChild(a);
                shown++;
            });
            if (shown > 0) section.style.display = 'block';
        })
        .catch(error => console.error('Latest videos error:', error));
}

// ---------- Milestones ----------
function nextMilestone(n) {
    const steps = [1000, 10000, 50000, 100000, 500000, 1000000, 5000000,
        10000000, 50000000, 100000000, 200000000, 500000000];
    for (const s of steps) {
        if (n < s) return s;
    }
    return null;
}

// ---------- Formatters ----------
function formatSubscriberCount(num) {
    const defaultFormat = formatNumber(num);
    let indianFormat = '';
    if (num >= 10000000) {
        indianFormat = (num / 10000000).toFixed(1) + ' Crores';
    } else if (num >= 100000) {
        indianFormat = (num / 100000).toFixed(1) + ' Lakhs';
    } else if (num >= 1000) {
        indianFormat = (num / 1000).toFixed(1) + ' Thousands';
    } else {
        indianFormat = num.toString();
    }
    return `${defaultFormat} (${indianFormat})`;
}

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// ---------- Error / notify ----------
function showError(message) {
    errorMessage.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle';
    errorMessage.appendChild(icon);
    errorMessage.appendChild(document.createTextNode(' ' + message));
    errorMessage.style.display = 'flex';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#F1F1F1' : '#282828';
    notification.style.color = document.documentElement.classList.contains('dark') ? '#0F0F0F' : '#FFFFFF';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '1000';
    notification.style.fontSize = '14px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// ---------- Share / copy ----------
function currentSummary() {
    const name = document.getElementById('channelName').textContent;
    const handle = document.getElementById('channelHandle').textContent;
    const subs = document.getElementById('statSubs').textContent;
    const views = document.getElementById('statViews').textContent;
    const videos = document.getElementById('statVideos').textContent;
    const id = document.getElementById('detailId').textContent;
    return { name, handle, subs, views, videos, id };
}

function shareStats() {
    const s = currentSummary();
    const shareText = `${s.name} (${s.handle}) — ${s.subs} subscribers, ${s.views} views, ${s.videos} videos`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: `${s.name} Stats`,
            text: shareText,
            url: shareUrl
        }).catch(error => console.log('Error sharing:', error));
    } else {
        copyToClipboard(`${shareText}\n\nCheck it out: ${shareUrl}`);
    }
}

function copyStats() {
    const s = currentSummary();
    const text = `${s.name} (${s.handle})\n` +
        `Subscribers: ${s.subs}\n` +
        `Total views: ${s.views}\n` +
        `Videos: ${s.videos}\n` +
        `https://www.youtube.com/channel/${s.id}`;
    copyToClipboard(text);
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        showNotification(successful ? 'Copied to clipboard!' : 'Unable to copy');
    } catch (err) {
        console.error('Error copying to clipboard:', err);
        showNotification('Error copying to clipboard');
    }

    document.body.removeChild(textarea);
}
