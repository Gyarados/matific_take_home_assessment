import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import ecr = require('aws-cdk-lib/aws-ecr');
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpAlbIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export const PREFIX = 'matific-test-app-';


export class EcrStack extends cdk.Stack {
  repository: ecr.Repository;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ecrRepository = new ecr.Repository(this, 'ecr-repo', {
      repositoryName: PREFIX + 'ecr-repo',
    });

    this.repository = ecrRepository;

  }
}


export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, ecrRepository: ecr.Repository, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      natGateways: 0,
      vpcName: PREFIX + 'vpc',
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ]
    });

    const cluster = new ecs.Cluster(this, 'ecs-cluster', { 
      vpc,
      clusterName: PREFIX + 'ecs-cluster',
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: PREFIX + 'ecs-logs',
    })

    const certicateArn = 'arn:aws:acm:sa-east-1:505857544867:certificate/99190aad-c43c-4e34-b5f1-6615132e64bf';

    const certicate = Certificate.fromCertificateArn(this, 'cert', certicateArn);

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "Service", {
      serviceName: PREFIX + 'service',
      loadBalancerName: PREFIX + 'alb',
      cluster,
      memoryLimitMiB: 512,
      cpu: 256, // 0.25 vCPU
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
        environment: {
          ALLOWED_HOSTS: "*",
          REQUIRED_SETTING: "true",
        },
        containerPort: 8000,
        logDriver: logging,
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8000/health/ || exit 1'],
        interval: cdk.Duration.minutes(1),
        startPeriod: cdk.Duration.seconds(5),
      },
      desiredCount: 1,
      // certificate: certicate,
      // redirectHTTP: true,
      publicLoadBalancer: false,
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }
    })

    const scaling = service.service.autoScaleTaskCount({ maxCapacity: 5, minCapacity: 1 });
    scaling.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 70 });
    scaling.scaleOnMemoryUtilization("RamScaling", { targetUtilizationPercent: 70 });

    service.targetGroup.configureHealthCheck({
      path: "/health/",
      interval: cdk.Duration.minutes(1),
    })

    const httpApi = new apigw2.HttpApi(this, "HttpApi", { apiName: PREFIX + 'api-gw', });

    httpApi.addRoutes({
      path: "/",
      methods: [apigw2.HttpMethod.GET],
      integration: new HttpAlbIntegration("AlbIntegration", service.listener)
    })

  }
}
