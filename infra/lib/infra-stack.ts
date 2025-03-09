import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');

const EPHEMERAL_PORT_RANGE = ec2.Port.tcpRange(32768, 65535);
const PREFIX = 'matific-test-app-';


export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', { 
      maxAzs: 2,
      
    });

    const asg = new autoscaling.AutoScalingGroup(this, PREFIX + 'asg', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      minCapacity: 1,
      maxCapacity: 3,
      vpc,
    });

    const cluster = new ecs.Cluster(this, PREFIX + 'ecs-cluster', { 
      vpc,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, PREFIX + 'asg-capacity-provider', {
      autoScalingGroup: asg,
      enableManagedTerminationProtection: true,
      enableManagedScaling: true,
    });

    cluster.addAsgCapacityProvider(capacityProvider);
  
    const ecsService = new ecs_patterns.NetworkLoadBalancedEc2Service(this, "Ec2Service", {
      cluster,
      memoryLimitMiB: 512,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      }
    });

    ecsService.service.connections.allowFromAnyIpv4(EPHEMERAL_PORT_RANGE);

    new cdk.CfnOutput(this, "networkLoadBalancerURL", {
      value: "https://"+ecsService.loadBalancer.loadBalancerDnsName,
      description: "Network LoadBalancer URL"
    });
  }
}
