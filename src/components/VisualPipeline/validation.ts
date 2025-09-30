import type {
  AppNodeData,
  CreateModelData,
  DataProcessData,
  DeployModelBatchInferenceData,
  DeployModelEndpointData,
  TrainModelData,
} from './types';
import { MSG } from './validation/messages';
import { PATH } from './validation/paths';

// Common regex patterns
export const nameRegex = /^[A-Za-z0-9\-_]{1,64}$/;
export const s3OrHttpsRegex = /^(https|s3):\/\/([^/]+)\/?(.*)$/;

export type ValidationError = {
  path: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

function push(errors: ValidationError[], path: string, message: string) {
  errors.push({ path, message });
}

export function validateNodeData(data: AppNodeData): ValidationResult {
  switch (data.kind) {
    case 'dataProcess':
      return validateDataProcess(data);
    case 'trainModel':
      return validateTrainModel(data);
    case 'createModel':
      return validateCreateModel(data);
    case 'deployModelBatchInference':
      return validateDeployModelBatchInference(data);
    case 'deployModelEndpoint':
      return validateDeployModelEndpoint(data);
    default:
      return { valid: true, errors: [] };
  }
}

export function validateCreateModel(data: CreateModelData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.Name || !nameRegex.test(data.Name)) {
    push(errors, PATH.cm.name, MSG.regexName);
  }
  if (!data.Type || data.Type !== 'Model') {
    push(errors, PATH.cm.type, MSG.typeMustBe('Model'));
  }
  if (!data.Arguments) {
    push(errors, PATH.cm.args, MSG.required('Arguments'));
  } else {
    if (!data.Arguments.ExecutionRoleArn) {
      push(errors, PATH.cm.execRole, MSG.required('ExecutionRoleArn'));
    }

    const pc = data.Arguments.PrimaryContainer;
    if (pc) {
      if (!pc.ModelDataUrl) {
        push(errors, PATH.cm.modelDataUrl, MSG.required('ModelDataUrl'));
      } else {
        if (typeof pc.ModelDataUrl === 'string') {
          const val = pc.ModelDataUrl;
          if (val === '') push(errors, PATH.cm.modelDataUrl, MSG.required('ModelDataUrl'));
          else if (!s3OrHttpsRegex.test(val)) push(errors, PATH.cm.modelDataUrl, MSG.uri);
          else if (val.length > 1024) push(errors, PATH.cm.modelDataUrl, MSG.maxLen(1024));
        } else {
          const val = pc.ModelDataUrl.Get;
          if (val == null || val === '') {
            push(errors, PATH.cm.modelDataUrlGet, MSG.required('ModelDataUrl.Get'));
          } else {
            // if (!s3OrHttpsRegex.test(val)) push(errors, PATH.cm.modelDataUrlGet, MSG.uri);
            if (val.length > 1024) push(errors, PATH.cm.modelDataUrlGet, MSG.maxLen(1024));
          }
        }
      }
    } else {
      push(errors, PATH.cm.primary, 'PrimaryContainer is required to supply ModelDataUrl');
    }
  }

  if (Array.isArray(data.DependsOn)) {
    for (let i = 0; i < data.DependsOn.length; i++) {
      const item = data.DependsOn[i];
      if (!nameRegex.test(item)) push(errors, PATH.cm.dependsOn(i), MSG.itemRegex);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateDataProcess(data: DataProcessData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.Name || !nameRegex.test(data.Name)) push(errors, PATH.dp.name, MSG.regexName);
  if (!data.Type || data.Type !== 'Processing')
    push(errors, PATH.dp.type, MSG.typeMustBe('Processing'));
  if (!data.Arguments) {
    push(errors, PATH.dp.args, MSG.required('Arguments'));
  } else {
    const cfg = data.Arguments.ProcessingResources?.ClusterConfig;
    if (!cfg) {
      push(errors, PATH.dp.cluster, MSG.required('ClusterConfig'));
    } else {
      if (cfg.InstanceCount == null)
        push(errors, PATH.dp.instanceCount, MSG.required('InstanceCount'));
      if (cfg.VolumeSizeInGB == null)
        push(errors, PATH.dp.volumeSize, MSG.required('VolumeSizeInGB'));
      if (!cfg.InstanceType) push(errors, PATH.dp.instanceType, MSG.required('InstanceType'));
    }

    const app = data.Arguments.AppSpecification;
    if (!app) push(errors, PATH.dp.appSpec, MSG.required('AppSpecification'));
    else if (!app.ImageUri) push(errors, PATH.dp.imageUri, MSG.required('ImageUri'));

    const inputs = data.Arguments.ProcessingInputs;
    if (!Array.isArray(inputs) || inputs.length === 0) {
      push(errors, PATH.dp.inputs, MSG.atLeastOne('ProcessingInput'));
    } else {
      inputs.forEach((inp, idx) => {
        if (!inp.InputName) push(errors, PATH.dp.inputNameAt(idx), MSG.required('InputName'));
        if (!inp.S3Input) push(errors, PATH.dp.s3InputAt(idx), MSG.required('S3Input'));
        else {
          if (!inp.S3Input.S3Uri) push(errors, PATH.dp.s3UriAt(idx), MSG.required('S3Uri'));
          if (!inp.S3Input.LocalPath)
            push(errors, PATH.dp.localPathAt(idx), MSG.required('LocalPath'));
          if (!inp.S3Input.S3DataType)
            push(errors, PATH.dp.s3DataTypeAt(idx), MSG.required('S3DataType'));
        }
      });
    }

    const procOut = data.Arguments.ProcessingOutputConfig;
    if (!procOut || !Array.isArray(procOut.Outputs) || procOut.Outputs.length === 0) {
      push(errors, PATH.dp.outputs, MSG.atLeastOne('ProcessingOutput'));
    } else {
      procOut.Outputs.forEach((out, idx) => {
        if (!out.OutputName) push(errors, PATH.dp.outputNameAt(idx), MSG.required('OutputName'));
        if (!out.S3Output) push(errors, PATH.dp.s3OutputAt(idx), MSG.required('S3Output'));
        else {
          if (!out.S3Output.S3Uri) push(errors, PATH.dp.s3OutUriAt(idx), MSG.required('S3Uri'));
          if (!out.S3Output.LocalPath)
            push(errors, PATH.dp.s3OutLocalPathAt(idx), MSG.required('LocalPath'));
          if (!out.S3Output.S3UploadMode)
            push(errors, PATH.dp.s3UploadModeAt(idx), MSG.required('S3UploadMode'));
        }
      });
    }

    if (
      data.Arguments.StoppingCondition &&
      data.Arguments.StoppingCondition.MaxRuntimeInSeconds == null
    ) {
      push(
        errors,
        PATH.dp.stoppingMax,
        'MaxRuntimeInSeconds is required when StoppingCondition is provided'
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTrainModel(data: TrainModelData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.Name || !nameRegex.test(data.Name)) push(errors, PATH.tm.name, MSG.regexName);
  if (!data.Type || data.Type !== 'Training')
    push(errors, PATH.tm.type, MSG.typeMustBe('Training'));
  if (!data.Arguments) {
    push(errors, PATH.tm.args, MSG.required('Arguments'));
  } else {
    const alg = data.Arguments.AlgorithmSpecification;
    if (!alg) push(errors, PATH.tm.algo, MSG.required('AlgorithmSpecification'));
    else {
      if (!alg.TrainingImage) push(errors, PATH.tm.trainingImage, MSG.required('TrainingImage'));
      if (!alg.TrainingInputMode)
        push(errors, PATH.tm.trainingInputMode, MSG.required('TrainingInputMode'));
    }

    const rc = data.Arguments.ResourceConfig;
    if (!rc) push(errors, PATH.tm.rc, MSG.required('ResourceConfig'));
    else {
      if (!rc.InstanceType) push(errors, PATH.tm.rcInstanceType, MSG.required('InstanceType'));
      if (rc.InstanceCount == null)
        push(errors, PATH.tm.rcInstanceCount, MSG.required('InstanceCount'));
      if (rc.VolumeSizeInGB == null)
        push(errors, PATH.tm.rcVolumeSize, MSG.required('VolumeSizeInGB'));
    }

    const idc = data.Arguments.InputDataConfig;
    if (!Array.isArray(idc) || idc.length === 0) {
      push(errors, PATH.tm.idc, MSG.atLeastOne('InputDataConfig item'));
    } else {
      idc.forEach((inp, idx) => {
        if (!inp.ChannelName)
          push(errors, PATH.tm.idcChannelNameAt(idx), MSG.required('ChannelName'));
        const s3 = inp.DataSource?.S3DataSource;
        if (!s3) push(errors, PATH.tm.idcS3At(idx), MSG.required('S3DataSource'));
        else {
          if (!s3.S3DataType) push(errors, PATH.tm.idcS3TypeAt(idx), MSG.required('S3DataType'));
          if (!s3.S3Uri) push(errors, PATH.tm.idcS3UriAt(idx), MSG.required('S3Uri'));
        }
      });
    }

    const out = data.Arguments.OutputDataConfig;
    if (!out || !out.S3OutputPath) push(errors, PATH.tm.outS3, MSG.required('S3OutputPath'));

    const sc = data.Arguments.StoppingCondition;
    if (!sc || sc.MaxRuntimeInSeconds == null)
      push(errors, PATH.tm.stoppingMax, MSG.required('StoppingCondition.MaxRuntimeInSeconds'));
  }

  if (Array.isArray(data.DependsOn)) {
    for (let i = 0; i < data.DependsOn.length; i++) {
      const item = data.DependsOn[i];
      if (!nameRegex.test(item)) push(errors, PATH.tm.dependsOn(i), MSG.itemRegex);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateDeployModelBatchInference(
  data: DeployModelBatchInferenceData
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.Name || !nameRegex.test(data.Name)) push(errors, PATH.dmbi.name, MSG.regexName);
  if (!data.Type || data.Type !== 'Transform')
    push(errors, PATH.dmbi.type, MSG.typeMustBe('Transform'));

  if (!data.Arguments) {
    push(errors, PATH.dmbi.args, MSG.required('Arguments'));
  } else {
    // ModelName.Get
    const mn = data.Arguments.ModelName;
    if (!mn || !mn.Get) push(errors, PATH.dmbi.ModelNameGet, MSG.required('ModelName.Get'));

    // TransformInput
    const ti = data.Arguments.TransformInput;
    if (!ti) push(errors, PATH.dmbi.transformInput, MSG.required('TransformInput'));
    else {
      const s3 = ti.DataSource?.S3DataSource;
      if (!ti.DataSource)
        push(errors, PATH.dmbi.transformInputDataSource, MSG.required('DataSource'));
      if (!s3) push(errors, PATH.dmbi.transformInputS3DataSource, MSG.required('S3DataSource'));
      else {
        if (!s3.S3Uri)
          push(errors, PATH.dmbi.transformInputS3DataSourceS3Uri, MSG.required('S3Uri'));
        if (!s3.S3DataType)
          push(errors, PATH.dmbi.transformInputS3DataSource, MSG.required('S3DataType'));
      }
    }

    // TransformOutput
    const to = data.Arguments.TransformOutput;
    if (!to || !to.S3OutputPath)
      push(errors, PATH.dmbi.transformOutputS3OutputPath, MSG.required('S3OutputPath'));

    // TransformResources
    const tr = data.Arguments.TransformResources;
    if (!tr) push(errors, PATH.dmbi.transformResources, MSG.required('TransformResources'));
    else {
      if (!tr.InstanceType)
        push(errors, PATH.dmbi.transformResourcesInstanceType, MSG.required('InstanceType'));
      if (tr.InstanceCount == null)
        push(errors, PATH.dmbi.transformResourcesInstanceCount, MSG.required('InstanceCount'));
    }

    // DataCaptureConfig
    const dcc = data.Arguments.DataCaptureConfig;
    if (dcc) {
      if (!dcc.DestinationS3Uri)
        push(errors, PATH.dmbi.dataCaptureDestination, MSG.required('DestinationS3Uri'));
      else if (!s3OrHttpsRegex.test(dcc.DestinationS3Uri))
        push(errors, PATH.dmbi.dataCaptureDestination, MSG.uri);
    }
  }

  if (Array.isArray(data.DependsOn)) {
    for (let i = 0; i < data.DependsOn.length; i++) {
      const item = data.DependsOn[i];
      if (!nameRegex.test(item)) push(errors, PATH.dmbi.dependsOn(i), MSG.itemRegex);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateDeployModelEndpoint(data: DeployModelEndpointData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.Name || !nameRegex.test(data.Name)) push(errors, PATH.dme.name, MSG.regexName);
  if (!data.Type || data.Type !== 'Endpoint')
    push(errors, PATH.dme.type, MSG.typeMustBe('Endpoint'));

  if (!data.Arguments) {
    push(errors, PATH.dme.args, MSG.required('Arguments'));
  } else {
    if (!data.Arguments.EndpointName)
      push(errors, PATH.dme.endpointName, MSG.required('EndpointName'));
    const ec = data.Arguments.EndpointConfig;
    if (!ec) push(errors, PATH.dme.endpointConfig, MSG.required('EndpointConfig'));
    else if (!Array.isArray(ec.ProductionVariants) || ec.ProductionVariants.length === 0) {
      push(errors, PATH.dme.pv, MSG.atLeastOne('ProductionVariants'));
    } else {
      ec.ProductionVariants.forEach((pv, i) => {
        if (pv.InitialInstanceCount == null)
          push(errors, PATH.dme.pvInitial(i), MSG.required('InitialInstanceCount'));
        if (!pv.InstanceType)
          push(errors, PATH.dme.pvInstanceType(i), MSG.required('InstanceType'));
        if (!pv.VariantName) push(errors, PATH.dme.pvVariantName(i), MSG.required('VariantName'));
        if (!pv.ModelName || !pv.ModelName.Get)
          push(errors, PATH.dme.pvModelNameGet(i), MSG.required('ModelName.Get'));
        if (pv.ManagedInstanceScaling && pv.ManagedInstanceScaling.MaxInstanceCount != null) {
        }
      });
    }
  }

  if (Array.isArray(data.DependsOn)) {
    for (let i = 0; i < data.DependsOn.length; i++) {
      const item = data.DependsOn[i];
      if (!nameRegex.test(item)) push(errors, PATH.dme.dependsOn(i), MSG.itemRegex);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeErrors(
  nodeId: string,
  nodeLabel: string,
  result: ValidationResult
): string {
  if (result.valid) return '';
  const head = `Node ${nodeLabel} (${nodeId}) has validation errors:`;
  const lines = result.errors.slice(0, 5).map((e) => `- ${e.path}: ${e.message}`);
  const more = result.errors.length > 5 ? `...and ${result.errors.length - 5} more.` : '';
  return [head, ...lines, more].filter(Boolean).join('\n');
}
