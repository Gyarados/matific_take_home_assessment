import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import ecr = require('aws-cdk-lib/aws-ecr');

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

    // const asg = new autoscaling.AutoScalingGroup(this, 'asg', {
    //   autoScalingGroupName: PREFIX + 'asg',
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
    //   machineImage: ec2.MachineImage.latestAmazonLinux2023({
    //     cpuType: ec2.AmazonLinuxCpuType.X86_64,
    //   }),
    //   minCapacity: 1,
    //   maxCapacity: 3,
    //   vpc,
    // });

    const cluster = new ecs.Cluster(this, 'ecs-cluster', { 
      vpc,
      clusterName: PREFIX + 'ecs-cluster',
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "Service", {
      serviceName: PREFIX + 'service',
      loadBalancerName: PREFIX + 'alb',
      cluster,
      memoryLimitMiB: 512,
      cpu: 256, // 0.25 vCPU
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
        // environment: {
        //   ENV_VAR_1: "value1",
        //   ENV_VAR_2: "value2",
        // },
        containerPort: 8000
      },
      desiredCount: 1,
    })

    service.targetGroup.configureHealthCheck({
      path: "/health"
    })
  }
}
