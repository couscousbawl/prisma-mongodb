import { ActionFunction, json } from "@remix-run/node";
import type { UploadHandler } from "@remix-run/node";
import {
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { requireUserId } from "~/utils/auth.server";
import { s3UploadHandler } from "~/utils/s3.server";
import { prisma } from "~/utils/prisma.server";

export const action: ActionFunction = async ({ request }) => {
  // 1
  const userId = await requireUserId(request);
  // 2
  const uploadHandler: UploadHandler = composeUploadHandlers(
    s3UploadHandler,
    createMemoryUploadHandler(),
  );

  const formData = await parseMultipartFormData(request, uploadHandler);
  const imageUrl = formData.get("profile-pic")?.toString() || '';

  if (!imageUrl) {
    return json({
      errorMsg: "Something went wrong while uploading",
    });
  }

  // 3
  await prisma.user.update({
    data: {
      profile: {
        update: {
          profilePic: imageUrl,
        },
      },
    },
    where: {
      id: userId,
    },
  });

  // 4
  return json({ imageUrl });
};