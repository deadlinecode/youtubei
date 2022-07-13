import { getContinuationFromItems, mapFilter, YoutubeRawData } from "../../common";
import { I_END_POINT } from "../../constants";
import { Continuable, ContinuableConstructorParams, FetchReturnType } from "../Continuable";
import { VideoCompact } from "../VideoCompact";
import { BaseChannel } from "./BaseChannel";
import { BaseChannelParser } from "./BaseChannelParser";

type ConstructorParams = ContinuableConstructorParams & {
	channel?: BaseChannel;
};

/**
 * {@link Continuable} of videos inside a {@link BaseChannel}
 *
 * @example
 * ```js
 * const channel = await youtube.findOne(CHANNEL_NAME, {type: "channel"});
 * await channel.videos.next();
 * console.log(channel.videos.items) // first 30 videos
 *
 * let newVideos = await channel.videos.next();
 * console.log(newVideos) // 30 loaded videos
 * console.log(channel.videos.items) // first 60 videos
 *
 * await channel.videos.next(0); // load the rest of the videos in the channel
 * ```
 */
export class ChannelVideos extends Continuable<VideoCompact> {
	/** The channel this videos belongs to */
	channel?: BaseChannel;

	/** @hidden */
	constructor({ client, channel }: ConstructorParams) {
		super({ client, strictContinuationCheck: true });
		this.channel = channel;
	}

	protected async fetch(): FetchReturnType<VideoCompact> {
		const params = "EgZ2aWRlb3M%3D";

		const response = await this.client.http.post(`${I_END_POINT}/browse`, {
			data: { browseId: this.channel?.id, params, continuation: this.continuation },
		});

		const items = BaseChannelParser.parseTabData("videos", response.data);
		const continuation = getContinuationFromItems(items);
		const data = mapFilter(items, "gridVideoRenderer");

		return {
			continuation,
			items: data.map((i: YoutubeRawData) =>
				new VideoCompact({ client: this.client }).load(i)
			),
		};
	}
}
