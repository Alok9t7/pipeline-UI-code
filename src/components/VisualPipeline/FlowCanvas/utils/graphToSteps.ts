import type { Edge, Node } from '@xyflow/react';

import type {
  AppNodeData,
  SageMakerStep,
  ProcessingInput,
  ProcessingOutput,
  TrainingInput,
  DataProcessData,
  TrainModelData,
  CreateModelData,
  DeployModelBatchInferenceData,
  DeployModelEndpointData,
} from '../../types';

function collectConnectedNodeIds(edges: Edge[]): Set<string> {
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    if (edge.source) connectedIds.add(edge.source);
    if (edge.target) connectedIds.add(edge.target);
  }
  return connectedIds;
}

function buildIdToStepName(nodes: Node<AppNodeData>[]): Map<string, string> {
  const idToStepName = new Map<string, string>();
  for (const node of nodes) {
    const data = node.data as AppNodeData;
    const fallback = data.kind ? `${data.kind}-${node.id}` : `step-${node.id}`;
    const stepName = data.Name || data.name || fallback;
    idToStepName.set(node.id, stepName);
  }
  return idToStepName;
}

export function buildStepsFromGraph(allNodes: Node<AppNodeData>[], edges: Edge[]): SageMakerStep[] {
  const connectedIds = collectConnectedNodeIds(edges);
  const connectedNodes = allNodes.filter((n) => connectedIds.has(n.id));

  const idToStepName = buildIdToStepName(connectedNodes);

  const dependsOnFor = (nodeId: string): string[] | undefined => {
    const incoming = edges.filter((e) => e.target === nodeId);
    if (incoming.length === 0) return undefined;
    const list = incoming
      .map((e) => (e.source ? (idToStepName.get(e.source) ?? e.source) : undefined))
      .filter((n): n is string => Boolean(n));
    return list.length > 0 ? list : undefined;
  };

  const toProcessingStep = (node: Node<AppNodeData>) => {
    const nodeData = node.data as DataProcessData;
    const step: SageMakerStep = {
      Name: idToStepName.get(node.id) ?? '',
      Type: nodeData.Type ?? 'Processing',
      Arguments: {},
    };
    const args = nodeData.Arguments;
    if (args.RoleArn) step.Arguments.RoleArn = args.RoleArn;
    if (args.ProcessingResources?.ClusterConfig) {
      step.Arguments.ProcessingResources = {
        ClusterConfig: {
          InstanceCount: args.ProcessingResources.ClusterConfig.InstanceCount,
          InstanceType: args.ProcessingResources.ClusterConfig.InstanceType,
          VolumeSizeInGB: args.ProcessingResources.ClusterConfig.VolumeSizeInGB,
        },
      };
    }
    if (args.AppSpecification) {
      step.Arguments.AppSpecification = {
        ImageUri: args.AppSpecification.ImageUri,
        ...(Array.isArray(args.AppSpecification.ContainerEntrypoint) &&
        args.AppSpecification.ContainerEntrypoint.length > 0
          ? { ContainerEntrypoint: args.AppSpecification.ContainerEntrypoint }
          : {}),
        ...(Array.isArray(args.AppSpecification.ContainerArguments) &&
        args.AppSpecification.ContainerArguments.length > 0
          ? { ContainerArguments: args.AppSpecification.ContainerArguments }
          : {}),
      };
    }
    if (Array.isArray(args.ProcessingInputs)) {
      step.Arguments.ProcessingInputs = args.ProcessingInputs.map((inputItem: ProcessingInput) => ({
        InputName: inputItem.InputName,
        S3Input: {
          S3Uri: inputItem.S3Input?.S3Uri,
          LocalPath: inputItem.S3Input?.LocalPath,
          S3DataType: inputItem.S3Input?.S3DataType,
          S3InputMode: inputItem.S3Input?.S3InputMode,
          S3CompressionType: inputItem.S3Input?.S3CompressionType,
        },
      }));
    }
    if (args.ProcessingOutputConfig?.Outputs) {
      step.Arguments.ProcessingOutputConfig = {
        Outputs: args.ProcessingOutputConfig.Outputs.map((outputItem: ProcessingOutput) => ({
          OutputName: outputItem.OutputName,
          S3Output: {
            S3Uri: outputItem.S3Output?.S3Uri,
            LocalPath: outputItem.S3Output?.LocalPath,
            S3UploadMode: outputItem.S3Output?.S3UploadMode,
          },
        })),
      };
    }
    if (args.StoppingCondition?.MaxRuntimeInSeconds != null) {
      step.Arguments.StoppingCondition = {
        MaxRuntimeInSeconds: args.StoppingCondition.MaxRuntimeInSeconds,
      };
    }
    const dependsOn = dependsOnFor(node.id);
    if (dependsOn) step.DependsOn = dependsOn;
    return step;
  };

  const toTrainingStep = (node: Node<AppNodeData>) => {
    const nodeData = node.data as TrainModelData;
    const step: SageMakerStep = {
      Name: idToStepName.get(node.id) ?? '',
      Type: nodeData.Type ?? 'Training',
      Arguments: {},
    };
    const args = nodeData.Arguments;
    if (args.RoleArn) step.Arguments.RoleArn = args.RoleArn;
    if (args.AlgorithmSpecification) {
      step.Arguments.AlgorithmSpecification = {
        TrainingImage: args.AlgorithmSpecification.TrainingImage,
        TrainingInputMode: args.AlgorithmSpecification.TrainingInputMode,
      };
    }
    if (args.ResourceConfig) {
      step.Arguments.ResourceConfig = {
        InstanceType: args.ResourceConfig.InstanceType,
        InstanceCount: args.ResourceConfig.InstanceCount,
        VolumeSizeInGB: args.ResourceConfig.VolumeSizeInGB,
      };
    }
    if (Array.isArray(args.InputDataConfig)) {
      step.Arguments.InputDataConfig = args.InputDataConfig.map((inputItem: TrainingInput) => ({
        ChannelName: inputItem.ChannelName,
        DataSource: {
          S3DataSource: {
            S3DataType: inputItem.DataSource?.S3DataSource?.S3DataType,
            S3Uri: inputItem.DataSource?.S3DataSource?.S3Uri,
            S3DataDistributionType: inputItem.DataSource?.S3DataSource?.S3DataDistributionType,
          },
        },
        ...(inputItem.ContentType ? { ContentType: inputItem.ContentType } : {}),
        ...(inputItem.InputMode ? { InputMode: inputItem.InputMode } : {}),
      }));
    }
    if (args.OutputDataConfig) {
      step.Arguments.OutputDataConfig = {
        S3OutputPath: args.OutputDataConfig.S3OutputPath,
      };
    }
    if (args.StoppingCondition?.MaxRuntimeInSeconds != null) {
      step.Arguments.StoppingCondition = {
        MaxRuntimeInSeconds: args.StoppingCondition.MaxRuntimeInSeconds,
      };
    }
    if (args.HyperParameters && Object.keys(args.HyperParameters).length > 0) {
      step.Arguments.HyperParameters = args.HyperParameters;
    }
    const dependsOn = dependsOnFor(node.id);
    if (dependsOn) step.DependsOn = dependsOn;
    return step;
  };

  const toModelStep = (node: Node<AppNodeData>) => {
    const nodeData = node.data as CreateModelData;
    const step: SageMakerStep = {
      Name: idToStepName.get(node.id) ?? '',
      Type: nodeData.Type ?? 'Model',
      Arguments: {},
    };
    const args = nodeData.Arguments;
    if (args.ExecutionRoleArn) step.Arguments.ExecutionRoleArn = args.ExecutionRoleArn;
    if (args.PrimaryContainer) {
      step.Arguments.PrimaryContainer = {
        Image: args.PrimaryContainer.Image,
        ModelDataUrl: args.PrimaryContainer.ModelDataUrl,
        ...(args.PrimaryContainer.Environment &&
        Object.keys(args.PrimaryContainer.Environment).length > 0
          ? { Environment: args.PrimaryContainer.Environment }
          : {}),
      };
    }
    const dependsOn = dependsOnFor(node.id);
    if (dependsOn) step.DependsOn = dependsOn;
    return step;
  };

  const toDeployModelBatchInferenceStep = (node: Node<AppNodeData>) => {
    const nodeData = node.data as DeployModelBatchInferenceData;
    const step: SageMakerStep = {
      Name: idToStepName.get(node.id) ?? '',
      Type: nodeData.Type ?? 'Transform',
      Arguments: {},
    };
    const args = nodeData.Arguments;
    if (args.ModelName) step.Arguments.ModelName = args.ModelName;
    if (args.TransformInput) {
      step.Arguments.TransformInput = {
        DataSource: {
          S3DataSource: {
            S3DataType: args.TransformInput?.DataSource?.S3DataSource?.S3DataType,
            S3Uri: args.TransformInput?.DataSource?.S3DataSource?.S3Uri,
          },
        },
        ...(args.TransformInput?.ContentType
          ? { ContentType: args.TransformInput.ContentType }
          : {}),
        ...(args.TransformInput?.CompressionType
          ? { CompressionType: args.TransformInput.CompressionType }
          : {}),
        ...(args.TransformInput?.SplitType ? { SplitType: args.TransformInput.SplitType } : {}),
      };
    }
    if (args.TransformOutput) {
      step.Arguments.TransformOutput = {
        S3OutputPath: args.TransformOutput?.S3OutputPath,
        ...(args.TransformOutput?.Accept ? { Accept: args.TransformOutput.Accept } : {}),
        ...(args.TransformOutput?.AssembleWith
          ? { AssembleWith: args.TransformOutput.AssembleWith }
          : {}),
      };
    }
    if (args.DataCaptureConfig) {
      step.Arguments.DataCaptureConfig = {
        DestinationS3Uri: args.DataCaptureConfig.DestinationS3Uri,
      };
    }
    if (args.TransformResources) {
      step.Arguments.TransformResources = {
        InstanceType: args.TransformResources.InstanceType,
        InstanceCount: args.TransformResources.InstanceCount,
      };
    }
    const dependsOn = dependsOnFor(node.id);
    if (dependsOn) step.DependsOn = dependsOn;
    return step;
  };

  const toDeployModelEndpointSteps = (node: Node<AppNodeData>) => {
    const nodeData = node.data as DeployModelEndpointData;
    const baseName = idToStepName.get(node.id) ?? '';
    const endpointConfigName = `${baseName}_EndpointConfig`;
    const productionVariants = (nodeData.Arguments?.EndpointConfig?.ProductionVariants ?? []) as NonNullable<
      DeployModelEndpointData['Arguments']['EndpointConfig']
    >['ProductionVariants'];

    const endpointConfigStep: SageMakerStep = {
      Name: endpointConfigName,
      Type: 'EndpointConfig',
      Arguments: {
        ProductionVariants: productionVariants.map((variant) => ({
          InitialInstanceCount: variant.InitialInstanceCount,
          ...(variant.ManagedInstanceScaling?.MaxInstanceCount != null
            ? {
                ManagedInstanceScaling: {
                  MaxInstanceCount: variant.ManagedInstanceScaling.MaxInstanceCount,
                },
              }
            : {}),
          InstanceType: variant.InstanceType,
          ModelName: variant.ModelName,
          VariantName: variant.VariantName,
        })),
      },
      VirtualStepName: baseName,
      VirtualStepType: 'DeployModel',
    };

    const endpointStep: SageMakerStep = {
      Name: baseName,
      Type: 'Endpoint',
      Arguments: {
        EndpointName: nodeData.Arguments?.EndpointName,
        EndpointConfigName: { Get: `Steps.${endpointConfigName}.EndpointConfigName` },
      },
      VirtualStepName: baseName,
      VirtualStepType: 'DeployModel',
    };

    const dependsOn = dependsOnFor(node.id);
    if (dependsOn) {
      endpointConfigStep.DependsOn = dependsOn;
      endpointStep.DependsOn = dependsOn;
    }

    return [endpointConfigStep, endpointStep];
  };

  const steps: SageMakerStep[] = [];
  for (const node of connectedNodes) {
    switch ((node.data as AppNodeData).kind) {
      case 'dataProcess':
        steps.push(toProcessingStep(node));
        break;
      case 'trainModel':
        steps.push(toTrainingStep(node));
        break;
      case 'createModel':
        steps.push(toModelStep(node));
        break;
      case 'deployModelBatchInference':
        steps.push(toDeployModelBatchInferenceStep(node));
        break;
      case 'deployModelEndpoint':
        steps.push(...toDeployModelEndpointSteps(node));
        break;
      default:
        // skip unknown kinds
    }
  }

  return steps;
}
