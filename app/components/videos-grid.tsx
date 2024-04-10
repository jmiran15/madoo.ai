import { Video as VideoType } from "@prisma/client";

export default function VideosGrid({ videos }: { videos: VideoType[] }) {
  if (!videos) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-8 bg-gray-100 py-8">
      {videos.length === 0 ? (
        <div className="text-center text-gray-500">No videos to display</div>
      ) : (
        videos.map((video) => {
          return <Video key={video.id} video={video} />;
        })
      )}
    </div>
  );
}

function Video({ video }: { video: VideoType }) {
  return (
    <div key={video.id} className="max-w-4xl">
      <video
        controls
        src={video.url}
        className="mx-auto max-h-[50vh] w-full rounded-lg lg:max-h-[50vh]"
      ></video>
    </div>
  );
}
