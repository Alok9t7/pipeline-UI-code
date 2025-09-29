import type { Edge, Node } from '@xyflow/react';

import type { AppNodeData } from '../../types';

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
    const stepName = (data as any).Name || (data as any).name || fallback;
    idToStepName.set(node.id, stepName);
  }
  return idToStepName;
}

export function buildStepsFromGraph(allNodes: Node<AppNodeData>[], edges: Edge[]): any[] {
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
    const d = node.data as AppNodeData & { Arguments?: any; Type?: string };
    const step: any = {
      Name: idToStepName.get(node.id),
      Type: d.Type ?? 'Processing',
      Arguments: {},
    };
    const args = d.Arguments ?? {};
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
      step.Arguments.ProcessingInputs = args.ProcessingInputs.map((inp: any) => ({
        InputName: inp.InputName,
        S3Input: {
          S3Uri: inp.S3Input?.S3Uri,
          LocalPath: inp.S3Input?.LocalPath,
          S3DataType: inp.S3Input?.S3DataType,
          S3InputMode: inp.S3Input?.S3InputMode,
          S3CompressionType: inp.S3Input?.S3CompressionType,
        },
      }));
    }
    if (args.ProcessingOutputConfig?.Outputs) {
      step.Arguments.ProcessingOutputConfig = {
        Outputs: args.ProcessingOutputConfig.Outputs.map((out: any) => ({
          OutputName: out.OutputName,
          S3Output: {
            S3Uri: out.S3Output?.S3Uri,
            LocalPath: out.S3Output?.LocalPath,
            S3UploadMode: out.S3Output?.S3UploadMode,
          },
        })),
      };
    }
    if (args.StoppingCondition?.MaxRuntimeInSeconds != null) {
      step.Arguments.StoppingCondition = {
        MaxRuntimeInSeconds: args.StoppingCondition.MaxRuntimeInSeconds,
      };
    }
    const deps = dependsOnFor(node.id);
    if (deps) step.DependsOn = deps;
    return step;
  };

  const toTrainingStep = (node: Node<AppNodeData>) => {
    const d = node.data as AppNodeData & { Arguments?: any; Type?: string };
    const step: any = {
      Name: idToStepName.get(node.id),
      Type: d.Type ?? 'Training',
      Arguments: {},
    };
    const args = d.Arguments ?? {};
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
      step.Arguments.InputDataConfig = args.InputDataConfig.map((inp: any) => ({
        ChannelName: inp.ChannelName,
        DataSource: {
          S3DataSource: {
            S3DataType: inp.DataSource?.S3DataSource?.S3DataType,
            S3Uri: inp.DataSource?.S3DataSource?.S3Uri,
            S3DataDistributionType: inp.DataSource?.S3DataSource?.S3DataDistributionType,
          },
        },
        ...(inp.ContentType ? { ContentType: inp.ContentType } : {}),
        ...(inp.InputMode ? { InputMode: inp.InputMode } : {}),
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
    const deps = dependsOnFor(node.id);
    if (deps) step.DependsOn = deps;
    return step;
  };

  const toModelStep = (node: Node<AppNodeData>) => {
    const d = node.data as AppNodeData & { Arguments?: any; Type?: string };
    const step: any = {
      Name: idToStepName.get(node.id),
      Type: d.Type ?? 'Model',
      Arguments: {},
    };
    const args = d.Arguments ?? {};
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
    const deps = dependsOnFor(node.id);
    if (deps) step.DependsOn = deps;
    return step;
  };

  const toDeployModelBatchInferenceStep = (node: Node<AppNodeData>) => {
    const d = node.data as AppNodeData & { Arguments?: any; Type?: string };
    const step: any = {
      Name: idToStepName.get(node.id),
      Type: d.Type ?? 'Transform',
      Arguments: {},
    };
    const args = d.Arguments ?? {};
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
    const deps = dependsOnFor(node.id);
    if (deps) step.DependsOn = deps;
    return step;
  };

  const toDeployModelEndpointSteps = (node: Node<AppNodeData>) => {
    const d = node.data as any;
    const baseName = idToStepName.get(node.id) as string;
    const endpointConfigName = `${baseName}_EndpointConfig`;
    const pv = d.Arguments?.EndpointConfig?.ProductionVariants ?? [];

    const endpointConfigStep: any = {
      Name: endpointConfigName,
      Type: 'EndpointConfig',
      Arguments: {
        ProductionVariants: pv.map((v: any) => ({
          InitialInstanceCount: v.InitialInstanceCount,
          ...(v.ManagedInstanceScaling?.MaxInstanceCount != null
            ? {
                ManagedInstanceScaling: {
                  MaxInstanceCount: v.ManagedInstanceScaling.MaxInstanceCount,
                },
              }
            : {}),
          InstanceType: v.InstanceType,
          ModelName: v.ModelName,
          VariantName: v.VariantName,
        })),
      },
      VirtualStepName: baseName,
      VirtualStepType: 'DeployModel',
    };

    const endpointStep: any = {
      Name: baseName,
      Type: 'Endpoint',
      Arguments: {
        EndpointName: d.Arguments?.EndpointName,
        EndpointConfigName: { Get: `Steps.${endpointConfigName}.EndpointConfigName` },
      },
      VirtualStepName: baseName,
      VirtualStepType: 'DeployModel',
    };

    const deps = dependsOnFor(node.id);
    if (deps) {
      endpointConfigStep.DependsOn = deps;
      endpointStep.DependsOn = deps;
    }

    return [endpointConfigStep, endpointStep];
  };

  const steps: any[] = [];
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
        steps.push({});
    }
  }

  return steps;
}
