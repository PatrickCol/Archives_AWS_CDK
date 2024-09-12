import * as cdk from 'aws-cdk-lib';
import { Instance, InstanceType, MachineImage, Vpc, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyEc2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC (Virtual Private Cloud) predeterminada
    const vpc = Vpc.fromLookup(this, 'VPC', { isDefault: true });

    // Grupo de seguridad para la instancia
    const securityGroup = new SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      description: 'Permitir trafico SSH y HTTP desde cualquier lugar',
      allowAllOutbound: true,
    });

    // Reglas de ingreso para SSH y HTTP
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Permitir SSH');
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Permitir HTTP');

    // Definir la instancia EC2
    const instance = new Instance(this, 'EC2Instance', {
      vpc,
      instanceType: InstanceType.of(cdk.aws_ec2.InstanceClass.T2, cdk.aws_ec2.InstanceSize.MICRO),
      machineImage: MachineImage.genericLinux({
        'us-east-1': 'ami-0aa28dab1f2852040',  // AMI específica
      }),
      securityGroup,
      keyName: 'vockey',
    });

    // Comando UserData para clonar repositorios y configurar el servidor web
    instance.addUserData(
      `#!/bin/bash`,
      `cd /var/www/html/`,
      `git clone https://github.com/utec-cc-2024-2-test/websimple.git`,
      `git clone https://github.com/utec-cc-2024-2-test/webplantilla.git`,
      `ls -l`
    );

    // Outputs: IP Pública y URLs de los sitios web
    new cdk.CfnOutput(this, 'InstancePublicIP', {
      value: instance.instancePublicIp,
      description: 'IP pública de la instancia',
    });

    new cdk.CfnOutput(this, 'websimpleURL', {
      value: `http://${instance.instancePublicIp}/websimple`,
      description: 'URL de websimple',
    });

    new cdk.CfnOutput(this, 'webplantillaURL', {
      value: `http://${instance.instancePublicIp}/webplantilla`,
      description: 'URL de webplantilla',
    });
  }
}
