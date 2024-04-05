import { Video } from "@prisma/client";
export default function VideosGrid({ videos }: { videos: Video[] }) {
  if (!videos) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {videos.length === 0 ? (
        <div className="text-center text-gray-500">No videos to display</div>
      ) : (
        videos.map((video) => {
          return (
            <div
              key={video.id}
              className="bg-white shadow overflow-hidden rounded-lg"
            >
              <video controls src={video.url} className="w-full"></video>
            </div>
          );
        })
      )}
    </div>
  );
}
