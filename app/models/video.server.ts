import { Video } from "@prisma/client";

import { prisma } from "~/db.server";

export function createVideo({
  url,
  userId,
}: {
  url: Video["url"];
  userId: Video["userId"];
}) {
  return prisma.video.create({
    data: {
      url,
      userId,
    },
  });
}

export function getVideos({ userId }: { userId: Video["userId"] }) {
  return prisma.video.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function getAllVideos() {
  return prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });
}
