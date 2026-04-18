const YOUTUBE_STREAMS = 'https://www.youtube.com/@hopechurch3091/streams' as const

export const SITE = {
	name: 'Hope Community SDA Church',
	short: 'Hope SDA',
	description:
		'A friendly family church on Churchfields Road, Beckenham, Bromley — South London. A new home online is on the way.',
	url: 'https://hopesda.church',
	address: {
		line1: '56 Churchfields Road',
		line2: 'Beckenham, Bromley',
		postcode: 'BR3 4QW',
		country: 'United Kingdom',
		mapsUrl:
			'https://maps.google.com/maps/dir//Hope+Community+Beckenham+Seventh-Day+Adventist+Church+56+Churchfields+Rd+Beckenham+BR3+4QW/@51.4077837,-0.0442606,10z/data=!4m5!4m4!1m0!1m2!1m1!1s0x487601a051702df7:0x92a87b5f4a97c482',
	},
	worship: {
		day: 'Every Saturday',
		sabbathSchool: '10:00 AM',
		familyService: '11:15 AM',
	},
	/** YouTube Live / scheduled streams — same link used in header, hero, cards, footer */
	liveStream: {
		url: YOUTUBE_STREAMS,
		title: 'Live on YouTube every Saturday',
		blurb:
			'We stream worship here every week — tune in from home or on the go.',
	},
	social: {
		facebook: 'https://www.facebook.com/hopesdauk',
		instagram: 'https://www.instagram.com/hopesdauk/',
		youtube: YOUTUBE_STREAMS,
	},
	contactEmail: 'info@hopesda.uk',
} as const

export const ASSETS = {
	// Reused directly from the existing Webflow CDN — no re-upload needed
	heroVideoMp4:
		'https://cdn.prod.website-files.com/6424648a955a23775f14a06a/64c52c5b16fce3dec2cc1df4_video-transcode.mp4',
	heroVideoWebm:
		'https://cdn.prod.website-files.com/6424648a955a23775f14a06a/64c52c5b16fce3dec2cc1df4_video-transcode.webm',
	heroPoster:
		'https://cdn.prod.website-files.com/6424648a955a23775f14a06a/64c52c5b16fce3dec2cc1df4_video-poster-00001.jpg',
	logo: 'https://cdn.prod.website-files.com/6424648a955a23775f14a06a/64b9432a8e3bc01676f883e3_efefe.png',
	ogImage:
		'https://cdn.prod.website-files.com/6424648a955a23775f14a06a/64c52c5b16fce3dec2cc1df4_video-poster-00001.jpg',
} as const
