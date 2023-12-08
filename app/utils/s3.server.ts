import { PassThrough } from "stream";
import cuid from "cuid";
import type { UploadHandler } from "@remix-run/node";
import { writeAsyncIterableToWritable } from "@remix-run/node";
import AWS from "aws-sdk";

const {
    KUDOS_BUCKET_REGION,
    KUDOS_KEY_ACCESS_ID,
    KUDOS_SECRET_ACCESS_KEY,
    KUDOS_BUCKET_NAME
} = process.env

if (!(KUDOS_KEY_ACCESS_ID && KUDOS_SECRET_ACCESS_KEY && KUDOS_BUCKET_REGION && KUDOS_BUCKET_NAME)){
    throw new Error(`S3 Storage is missing required configuration.`);
}

const uploadStream = ({ Key }: Pick<AWS.S3.Types.PutObjectRequest, "Key">,) => {
    const s3 = new AWS.S3({
        credentials: {
            accessKeyId: KUDOS_KEY_ACCESS_ID,
            secretAccessKey: KUDOS_SECRET_ACCESS_KEY,
        },
        region: KUDOS_BUCKET_REGION,
    });
    const pass = new PassThrough();
    return {
        writeStream: pass,
        promise: s3.upload({ 
            Bucket: KUDOS_BUCKET_NAME, 
            Key, 
            Body: pass 
        }).promise(),
    };
};

export async function uploadStreamToS3(data: any, filename: string) {
    const stream = uploadStream({
        Key: `${cuid()}.${filename.split(".").slice(-1)}`,
    });
    await writeAsyncIterableToWritable(data, stream.writeStream);
    const file = await stream.promise;
    return file.Location;
}

export const s3UploadHandler: UploadHandler = async ({
    name,
    filename,
    data,
}) => {
    if (name !== "profile-pic") {
        return undefined;
    }
    const uploadedFileLocation = await uploadStreamToS3(data, filename!);
    return uploadedFileLocation;
};


