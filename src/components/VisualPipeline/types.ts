import type { Node } from '@xyflow/react';

export type NodeKind =
  | 'dataProcess'
  | 'trainModel'
  | 'createModel'
  | 'deployModelEndpoint'
  | 'deployModelBatchInference';

export type BaseNodeData = {
  kind: NodeKind;
  label: string;
  name?: string;
};

export type DataProcessData = BaseNodeData & {
  kind: 'dataProcess';
  Name: string;
  DisplayName?: string;
  Type?: string;
  Arguments: {
    RoleArn: string;
    ProcessingResources: {
      ClusterConfig: {
        InstanceCount: number;
        InstanceType: string;
        VolumeSizeInGB: number;
      };
    };
    AppSpecification: {
      ImageUri: string;
      ContainerEntrypoint?: string[];
      ContainerArguments?: string[];
    };
    ProcessingInputs: Array<{
      InputName: string;
      S3Input: {
        S3Uri: string;
        LocalPath: string;
        S3DataType: string;
        S3InputMode: string;
        S3CompressionType: string;
      };
    }>;
    ProcessingOutputConfig: {
      Outputs: Array<{
        OutputName: string;
        S3Output: {
          S3Uri: string;
          LocalPath: string;
          S3UploadMode: string;
        };
      }>;
    };
    StoppingCondition: {
      MaxRuntimeInSeconds: number;
    };
  };
};

export type TrainModelData = BaseNodeData & {
  kind: 'trainModel';
  Name: string;
  DisplayName?: string;
  Type?: string;
  DependsOn?: string[];
  Arguments: {
    RoleArn: string;
    AlgorithmSpecification: {
      TrainingImage: string;
      TrainingInputMode: string;
    };
    ResourceConfig: {
      InstanceType: string;
      InstanceCount: number;
      VolumeSizeInGB: number;
    };
    InputDataConfig: Array<{
      ChannelName: string;
      DataSource: {
        S3DataSource: {
          S3DataType: string;
          S3Uri: string;
          S3DataDistributionType: string;
        };
      };
      ContentType?: string;
      InputMode?: string;
    }>;
    OutputDataConfig: {
      S3OutputPath: string;
    };
    StoppingCondition: {
      MaxRuntimeInSeconds: number;
    };
    HyperParameters?: Record<string, string>;
  };
};
export type CreateModelData = BaseNodeData & {
  kind: 'createModel';
  Name: string;
  DisplayName?: string;
  Type?: string;
  DependsOn?: string[];
  Arguments: {
    ExecutionRoleArn: string;
    PrimaryContainer: {
      Image: string;
      ModelDataUrl: {
        Get: string;
      };
      Environment?: Record<string, string>;
    };
  };
};

export type DeployModelBatchInferenceData = BaseNodeData & {
  kind: 'deployModelBatchInference';
  Name: string;
  DisplayName?: string;
  Type?: string;
  DependsOn?: string[];
  Arguments: {
    ModelName: {
      Get: string;
    };
    TransformInput: {
      DataSource: {
        S3DataSource: {
          S3DataType: string;
          S3Uri: string;
        };
      };
      ContentType?: string;
      CompressionType?: string;
      SplitType?: string;
    };
    TransformOutput: {
      S3OutputPath: string;
      Accept?: string;
      AssembleWith?: string;
    };
    TransformResources: {
      InstanceType: string;
      InstanceCount: number;
    };
    DataCaptureConfig?: {
      DestinationS3Uri: string;
    };
  };
};

export type DeployModelEndpointData = BaseNodeData & {
  kind: 'deployModelEndpoint';
  Name: string;
  DisplayName?: string;
  Type?: string; // Endpoint
  DependsOn?: string[];
  Arguments: {
    EndpointName: string;
    EndpointConfig?: {
      ProductionVariants: Array<{
        InitialInstanceCount: number;
        ManagedInstanceScaling?: {
          MaxInstanceCount?: number;
        };
        InstanceType: string;
        ModelName: {
          Get: string;
        };
        VariantName: string;
      }>;
    };
  };
};

export type AppNodeData =
  | DataProcessData
  | TrainModelData
  | CreateModelData
  | DeployModelBatchInferenceData
  | DeployModelEndpointData;

export type AppNode = Node<AppNodeData, 'appNode'>;

type PipelineDefinition = {
  Steps?: any[];
  [key: string]: any;
};

export type PipelineStep = {
  name: string;
  definition: PipelineDefinition;
};
