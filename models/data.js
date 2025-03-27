import mongoose from "mongoose";

const dataSchema = new mongoose.Schema({
  orgStructureRSM: { type: String, required: true },
  orgStructureTSM: { type: String, required: true },
  orgStructureSUP: { type: String, required: true },
  orgStructureTP: { type: String, required: true },
  visitDate: { type: Date, required: true },
  monthYear: { type: String, required: true },
  ttActualName: { type: String, required: true },
  ttCity: { type: String, required: true },
  ttActualAddress: { type: String, required: true },
  ttSubtype: { type: String, required: true },
  ttComment: { type: String },
  ttAdditionalId: { type: String },
  ttNetwork: { type: String },
  mrmMkk: { type: String },
  ttNumber: { type: String, required: true },
  survey: { type: String, required: true },
  surveyPage: { type: String, required: true },
  surveyElement: { type: String, required: true },
  surveyAnswer: { type: String, required: true },
  surveyContentLink: { type: String, required: true },
}, { timestamps: true });

const DataModel = mongoose.model("Data", dataSchema);
export default DataModel;