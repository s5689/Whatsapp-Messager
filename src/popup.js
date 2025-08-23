import { BACKGROUND } from './globals';

chrome.runtime.sendMessage({ msg: 'popup-open', target: BACKGROUND });
