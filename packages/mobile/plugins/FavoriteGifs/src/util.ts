import { findByProps } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { storage } from "@vendetta/plugin";

const ActionSheet = findByProps("openLazy", "hideActionSheet");
const { addFavoriteGIF, removeFavoriteGIF } = findByProps("addFavoriteGIF", "removeFavoriteGIF");

interface ImageEmbed {
	id: string;
	url: string;
	type: string;
	image: {
	  url: string;
	  proxyURL: string;
	  width: number;
	  height: number;
	};
	fields: any[];
}

interface VideoEmbed {
	id: string;
	url: string;
	type: string;
	thumbnail: {
		url: string;
		proxyURL: string;
		width: number;
		height: number;
	};
	video: {
	  url: string;
	  proxyURL: string;
	  width: number;
	  height: number;
	};
	fields: any[];
}

interface GifvEmbed {
	id: string;
	url: string;
	type: string;
	referenceId: string;
	provider: {
	  name: string;
	  url: string;
	};
	thumbnail: {
	  url: string;
	  proxyURL: string;
	  width: number;
	  height: number;
	};
	video: {
	  url: string;
	  proxyURL: string;
	  width: number;
	  height: number;
	};
	fields: any[];
}
  
interface Attachment {
	width: number;
	url: string;
	size: number;
	proxy_url: string;
	id: string;
	height: number;
	filename: string;
	content_type: string;
	spoiler: boolean;
}

interface Gif {
	format: number;
	src: string;
	url: string;
	width: number;
	height: number;
	order: number;
}

interface GifDetails { 
	src: string,
	url: string,
	width: number,
	height: number,
	format: number,
	isVideo?: boolean
}

interface FavoriteGifs {
	gifs: Record<string, Gif>;
}

export interface FrecencyStore {
	favoriteGifs: FavoriteGifs;
}  
  
export interface Message {
	embeds: (ImageEmbed | GifvEmbed)[];
	attachments: Attachment[];
}

export function getFilename(url: string): string {
    const path = new URL(url).pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename;
}

export function constructGif(currentGifs: Record<string, Gif>, gifDetails: GifDetails): Gif {
	const maxOrder = Math.max(...Object.values(currentGifs).map(gif => gif.order));

	const newGif: Gif = {
		format: gifDetails.format,
		src: gifDetails.src,
		url: gifDetails.url,
		width: gifDetails.width,
		height: gifDetails.height,
		order: maxOrder + 1,
	};

	return newGif;
}

export function getGifDetails(message: Message): GifDetails[] {
    const gifDetailsArray: GifDetails[] = [];

    for (let embed of message.embeds) {
        if (embed.type === 'gifv') {
            gifDetailsArray.push({ 
                src: (embed as GifvEmbed).video.url,
                url: (embed as GifvEmbed).url,
                width: (embed as GifvEmbed).thumbnail.width,
                height: (embed as GifvEmbed).thumbnail.height,
                format: 2
            });
        } else if (embed.type === 'image') {
            gifDetailsArray.push({ 
                src: (embed as ImageEmbed).image.url,
                url: (embed as ImageEmbed).url, 
                width: (embed as ImageEmbed).image.width, 
                height: (embed as ImageEmbed).image.height, 
                format: 1 
            });
        } else if (embed.type === 'video') {
            gifDetailsArray.push({ 
                src: (embed as VideoEmbed).video.url,
                url: (embed as VideoEmbed).url,
                width: (embed as VideoEmbed).thumbnail.width,
                height: (embed as VideoEmbed).thumbnail.height,
                format: 2,
				isVideo: true
            });
        }
    }
    
    for (let attachment of message.attachments) {
        if (attachment.content_type && attachment.content_type.includes('image')) {
            gifDetailsArray.push({
                src: attachment.url,
                url: attachment.url, 
                width: attachment.width, 
                height: attachment.height, 
                format: 1 
            });
        } else if (attachment.content_type && attachment.content_type.includes('video')) {
            gifDetailsArray.push({
                src: attachment.url,
                url: attachment.url, 
                width: attachment.width, 
                height: attachment.height, 
                format: 2,
                isVideo: true
            });
        }
    }
    
    return gifDetailsArray;
}

export const createOnPressHandler = (gifDetails: GifDetails, favorites: FrecencyStore, isGifFavorite: boolean, filename: string) => () => {
	const handleRemoveFavorite = () => {
	  removeFavoriteGIF(gifDetails.url);
	  showToast(`Removed ${filename} from Favorites`, getAssetIDByName("check"));
	};
  
	const handleAddFavorite = () => {
	  addFavoriteGIF(constructGif(favorites.favoriteGifs.gifs, gifDetails));
	  showToast(`Added ${filename} to Favorites`, getAssetIDByName("check"));
	};
  
	ActionSheet.hideActionSheet();
  
	if (isGifFavorite) {
	  if (storage.confirm) {
		showConfirmationAlert({
		  title: "Remove from Favorites",
		  content: `Are you sure you want to remove ${filename} from your favorites?`,
		  confirmText: "Remove",
		  cancelText: "Cancel",
		  onConfirm: handleRemoveFavorite
		});
	  } else {
		handleRemoveFavorite();
	  }
	} else {
	  if (gifDetails.isVideo) {
		showConfirmationAlert({
		  title: "Add video to Favorites",
		  content: "If a video is the first entry in the GIF picker, on mobile this breaks the picker until a new valid item is added or the video is removed. It will only show on Desktop.",
		  confirmText: "Add to Favorites",
		  cancelText: "Cancel",
		  onConfirm: handleAddFavorite
		});
	  } else if (storage.confirm) {
		showConfirmationAlert({
		  title: "Add to Favorites",
		  content: `Are you sure you want to add ${filename} to your favorites?`,
		  confirmText: "Add to Favorites",
		  cancelText: "Cancel",
		  onConfirm: handleAddFavorite
		});
	  } else {
		handleAddFavorite();
	  }
	}
  };