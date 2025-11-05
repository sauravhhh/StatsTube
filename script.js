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

document.getElementById('fetchButton').addEventListener('click', fetchChannelData);
document.getElementById('channelId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        fetchChannelData();
    }
});

// Clear button functionality
const clearBtn = document.getElementById('clearBtn');
const channelInput = document.getElementById('channelId');
const searchBtn = document.getElementById('fetchButton');

channelInput.addEventListener('input', function() {
    if (this.value.trim() !== '') {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
});

clearBtn.addEventListener('click', function() {
    channelInput.value = '';
    this.style.display = 'none';
    channelInput.focus();
});

// Add click event to share button
document.getElementById('shareBtn').addEventListener('click', shareStats);

// Add click event to copy buttons
document.getElementById('copyHandleBtn').addEventListener('click', function() {
    copyToClipboard(document.getElementById('channelHandle').textContent);
});

document.getElementById('copyIdBtn').addEventListener('click', function() {
    copyToClipboard(document.getElementById('channelIdDisplay').textContent);
});

function fetchChannelData() {
    const input = document.getElementById('channelId').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const loading = document.getElementById('loading');
    const channelInfo = document.getElementById('channelInfo');
    
    // Reset previous states
    errorMessage.style.display = 'none';
    channelInfo.style.display = 'none';
    
    if (!input) {
        showError('Please enter a channel ID, username or URL');
        return;
    }
    
    // Disable search button and show loading
    searchBtn.disabled = true;
    loading.style.display = 'block';
    
    // Check if input is a URL
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
    
    // First, try to get channel ID from username if needed
    fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                // Direct channel ID worked
                displayChannelInfo(data.items[0]);
            } else {
                // Try with username
                return fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&forUsername=${channelId}&key=${API_KEY}`)
                    .then(response => response.json())
                    .then(usernameData => {
                        if (usernameData.items && usernameData.items.length > 0) {
                            displayChannelInfo(usernameData.items[0]);
                        } else {
                            // Try searching for the channel
                            return fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${channelId}&type=channel&key=${API_KEY}`)
                                .then(response => response.json())
                                .then(searchData => {
                                    if (searchData.items && searchData.items.length > 0) {
                                        const channelIdFromSearch = searchData.items[0].id.channelId;
                                        return fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelIdFromSearch}&key=${API_KEY}`)
                                            .then(response => response.json())
                                            .then(channelData => {
                                                if (channelData.items && channelData.items.length > 0) {
                                                    displayChannelInfo(channelData.items[0]);
                                                } else {
                                                    showError('Channel not found');
                                                    searchBtn.disabled = false;
                                                    loading.style.display = 'none';
                                                    return;
                                                }
                                            });
                                    } else {
                                        showError('Channel not found');
                                        searchBtn.disabled = false;
                                        loading.style.display = 'none';
                                        return;
                                    }
                                });
                        }
                    });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred while fetching channel data');
            searchBtn.disabled = false;
            loading.style.display = 'none';
        })
        .finally(() => {
            // Re-enable search button and hide loading
            searchBtn.disabled = false;
            loading.style.display = 'none';
        });
}

function extractChannelFromUrl(url) {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const pathname = urlObj.pathname;
        
        // Handle different URL patterns
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

function displayChannelInfo(channel) {
    const channelAvatar = document.getElementById('channelAvatar');
    const channelName = document.getElementById('channelName');
    const channelHandle = document.getElementById('channelHandle');
    const subscriberCount = document.getElementById('subscriberCount');
    const viewCount = document.getElementById('viewCount');
    const videoCount = document.getElementById('videoCount');
    const channelCountry = document.getElementById('channelCountry');
    const channelJoined = document.getElementById('channelJoined');
    const channelIdDisplay = document.getElementById('channelIdDisplay');
    const channelDescription = document.getElementById('channelDescription');
    const channelInfo = document.getElementById('channelInfo');
    const inputField = document.getElementById('channelId');
    const avgViews = document.getElementById('avgViews');
    const channelAge = document.getElementById('channelAge');
    const channelTags = document.getElementById('channelTags');
    
    // Set avatar
    if (channel.snippet.thumbnails && channel.snippet.thumbnails.medium) {
        channelAvatar.innerHTML = `<img src="${channel.snippet.thumbnails.medium.url}" alt="${channel.snippet.title}">`;
    } else {
        channelAvatar.innerHTML = `<div style="font-size: 2rem; color: var(--youtube-medium-gray);"><i class="fas fa-user-circle"></i></div>`;
    }
    
    // Set channel name and handle
    channelName.textContent = channel.snippet.title;
    
    // Fix double @@ issue
    let handle = channel.snippet.customUrl || channel.id;
    if (handle.startsWith('@')) {
        channelHandle.textContent = handle;
    } else {
        channelHandle.textContent = `@${handle}`;
    }
    
    // Update input field with channel name or custom URL (not the ID)
    if (channel.snippet.customUrl) {
        inputField.value = channel.snippet.customUrl.startsWith('@') ? 
            channel.snippet.customUrl : 
            `@${channel.snippet.customUrl}`;
    } else {
        inputField.value = channel.snippet.title;
    }
    
    // Show clear button if there's text in the input
    if (inputField.value.trim() !== '') {
        clearBtn.style.display = 'flex';
    }
    
    // Format and set subscriber count (default format + Indian abbreviation in brackets)
    const subscribers = parseInt(channel.statistics.subscriberCount);
    subscriberCount.textContent = formatSubscriberCount(subscribers);
    
    // Format and set view count (default format only)
    const views = parseInt(channel.statistics.viewCount);
    viewCount.textContent = formatNumber(views);
    
    // Format and set video count (default format only)
    const videos = parseInt(channel.statistics.videoCount);
    videoCount.textContent = formatNumber(videos);
    
    // Set country
    channelCountry.textContent = channel.snippet.country || 'Not specified';
    
    // Set joined date
    if (channel.snippet.publishedAt) {
        const publishedDate = new Date(channel.snippet.publishedAt);
        channelJoined.textContent = formatDate(publishedDate);
    } else {
        channelJoined.textContent = 'Not available';
    }
    
    // Set channel ID
    channelIdDisplay.textContent = channel.id;
    
    // Calculate and set advanced stats
    // Average views per video
    const avgViewsPerVideo = videos > 0 ? Math.round(views / videos) : 0;
    avgViews.textContent = formatNumber(avgViewsPerVideo);
    
    // Channel age
    if (channel.snippet.publishedAt) {
        const publishedDate = new Date(channel.snippet.publishedAt);
        const now = new Date();
        const diffTime = Math.abs(now - publishedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        channelAge.textContent = `${years}y ${months}m`;
    } else {
        channelAge.textContent = 'Not available';
    }
    
    // Set channel tags/keywords
    channelTags.innerHTML = '';
    if (channel.brandingSettings && channel.brandingSettings.channel && channel.brandingSettings.channel.keywords) {
        const keywords = channel.brandingSettings.channel.keywords.split(',');
        keywords.slice(0, 8).forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.textContent = keyword.trim();
            channelTags.appendChild(tag);
        });
    } else {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = 'No keywords available';
        channelTags.appendChild(tag);
    }
    
    // Set channel description
    channelDescription.textContent = channel.snippet.description || 'No description available.';
    
    // Show channel info
    channelInfo.style.display = 'block';
}

function formatSubscriberCount(num) {
    // Get default format
    const defaultFormat = formatNumber(num);
    
    // Get Indian abbreviation with full text
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

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function shareStats() {
    const channelName = document.getElementById('channelName').textContent;
    const subscriberCount = document.getElementById('subscriberCount').textContent;
    const viewCount = document.getElementById('viewCount').textContent;
    const videoCount = document.getElementById('videoCount').textContent;
    
    const shareText = `${channelName} UTube Stats: ${subscriberCount} subscribers, ${viewCount} views, ${videoCount} videos`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: `${channelName} UTube Stats`,
            text: shareText,
            url: shareUrl
        })
        .catch(error => console.log('Error sharing:', error));
    } else {
        // Fallback to copying to clipboard
        const textToCopy = `${shareText}\n\nCheck it out: ${shareUrl}`;
        copyToClipboard(textToCopy);
    }
}

function copyToClipboard(text) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'Copied to clipboard!' : 'Unable to copy';
        
        // Show a temporary notification
        showNotification(msg);
    } catch (err) {
        console.error('Error copying to clipboard:', err);
        showNotification('Error copying to clipboard');
    }
    
    document.body.removeChild(textarea);
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'var(--youtube-black)';
    notification.style.color = 'var(--youtube-white)';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '1000';
    notification.style.fontSize = '14px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}