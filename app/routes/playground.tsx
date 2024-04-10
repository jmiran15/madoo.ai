import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import { MagicWand } from "@phosphor-icons/react";

import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from "~/components/ui/fieldset";
import { Listbox, ListboxLabel, ListboxOption } from "~/components/ui/listbox";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import { requireUserId } from "~/session.server";
import { getVideos } from "~/models/video.server";
import VideosGrid from "~/components/videos-grid";

const ASPECT_RATIOS = [
  { name: "16:9", value: "16:9" },
  { name: "1:1", value: "1:1" },
  { name: "21:9", value: "21:9" },
  { name: "2:3", value: "2:3" },
  { name: "3:2", value: "3:2" },
  { name: "4:5", value: "4:5" },
  { name: "5:4", value: "5:4" },
  { name: "9:16", value: "9:16" },
  { name: "9:21", value: "9:21" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  return json({ videos: await getVideos({ userId }) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const text = String(formData.get("text"));
  const aspectRatio = String(formData.get("aspect_ratio"));

  const video = await fetch("http://localhost:3000/api/generatevideo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, aspect_ratio: aspectRatio, userId }),
  });

  return json({ video });
};

export default function Playground() {
  const { videos } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  console.log({ video: actionData?.video });

  return (
    <div className="grid grid-cols-4 w-screen h-full">
      <Form method="post" className="col-span-1 p-4 overflow-y-auto">
        <Fieldset>
          <Legend>Video information</Legend>
          <Text>Enter the information for the video to be generated</Text>
          <FieldGroup>
            <Field>
              <Label>Video description</Label>
              <Textarea name="text" />
            </Field>
            <Field>
              <Label>Aspect ratio</Label>
              <Listbox name="aspect_ratio" defaultValue="9:16">
                {ASPECT_RATIOS.map(({ name, value }) => (
                  <ListboxOption key={value} value={value}>
                    <ListboxLabel>{name}</ListboxLabel>
                  </ListboxOption>
                ))}
              </Listbox>
            </Field>
            <Button color="purple" type="submit" className="w-full">
              Generate video
              <MagicWand />
            </Button>
          </FieldGroup>
        </Fieldset>
      </Form>
      <div
        id="input"
        className="col-span-3  h-full w-full overflow-x-hidden overflow-y-auto"
      >
        <VideosGrid videos={videos} />
      </div>
    </div>
  );
}
