import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";

export type TallyWebhookEventAttributes = {
  webhookEventId: number;
  eventId: string;
  receivedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TallyWebhookEventCreation = Optional<
  TallyWebhookEventAttributes,
  "webhookEventId" | "receivedAt" | "createdAt" | "updatedAt"
>;

export class TallyWebhookEvent
  extends Model<TallyWebhookEventAttributes, TallyWebhookEventCreation>
  implements TallyWebhookEventAttributes
{
  declare webhookEventId: number;
  declare eventId: string;
  declare receivedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TallyWebhookEvent.init(
  {
    webhookEventId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "webhook_event_id",
    },
    eventId: { type: DataTypes.STRING(255), allowNull: false, unique: true, field: "event_id" },
    receivedAt: { type: DataTypes.DATE, allowNull: true, field: "received_at" },
  },
  {
    sequelize,
    tableName: "tally_webhook_events",
    underscored: true,
    indexes: [{ unique: true, fields: ["event_id"] }],
  }
);
