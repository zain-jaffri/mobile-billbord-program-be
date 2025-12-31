import { sequelize } from "./sequelize";
import { Driver } from "../modules/drivers/driver.model";
import { Vehicle } from "../modules/vehicles/vehicle.model";
import { Deployment } from "../modules/deployments/deployment.model";
import { QRCode } from "../modules/qrCodes/qrCode.model";
import { OdometerReading } from "../modules/odometer/odometer.model";
import { FormSubmission } from "../modules/submissions/submission.model";
import { Payment } from "../modules/payments/payment.model";

// Define all associations in one place to avoid cyclic imports.
export const initDb = async (): Promise<void> => {
  // Driver → Vehicles
  Driver.hasMany(Vehicle, { foreignKey: "driverId" });
  Vehicle.belongsTo(Driver, { foreignKey: "driverId" });

  // Vehicle → Deployments
  Vehicle.hasMany(Deployment, { foreignKey: "vehicleId" });
  Deployment.belongsTo(Vehicle, { foreignKey: "vehicleId" });

  // QRCode → Deployments
  QRCode.hasMany(Deployment, { foreignKey: "qrId" });
  Deployment.belongsTo(QRCode, { foreignKey: "qrId" });

  // Vehicle → Odometer readings
  Vehicle.hasMany(OdometerReading, { foreignKey: "vehicleId" });
  OdometerReading.belongsTo(Vehicle, { foreignKey: "vehicleId" });

  // QRCode → Form submissions
  QRCode.hasMany(FormSubmission, { foreignKey: "qrId" });
  FormSubmission.belongsTo(QRCode, { foreignKey: "qrId" });

  // Driver → Payments
  Driver.hasMany(Payment, { foreignKey: "driverId" });
  Payment.belongsTo(Driver, { foreignKey: "driverId" });

  // Validate DB connectivity early.
  await sequelize.authenticate();
};

// Export models for simple DI wiring in routes/services.
export const models = {
  Driver,
  Vehicle,
  Deployment,
  QRCode,
  OdometerReading,
  FormSubmission,
  Payment,
};
