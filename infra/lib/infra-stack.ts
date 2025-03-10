import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import ecr = require('aws-cdk-lib/aws-ecr');
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

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
      maxAzs: 2, // 1 public + 1 private subnets
      vpcName: PREFIX + 'vpc',
      restrictDefaultSecurityGroup: false,
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
        },
        containerPort: 8000,
        logDriver: logging,
      },
      desiredCount: 1,
      certificate: certicate,
      redirectHTTP: true,
      publicLoadBalancer: true,
    })

    service.targetGroup.configureHealthCheck({
      path: "/health/",
      interval: cdk.Duration.minutes(1),
    })
  }
}
