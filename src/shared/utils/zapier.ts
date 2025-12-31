import { config } from "../config";

export type ZapierNewDriverPayload = {
  name: string;
  email: string;
  driverId: number;
};

// Fire-and-forget webhook; called only after transaction commit.
export const notifyZapierNewDriver = async (payload: ZapierNewDriverPayload): Promise<void> => {
  if (!config.zapier.webhookUrl) {
    return;
  }

  await fetch(config.zapier.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
};
