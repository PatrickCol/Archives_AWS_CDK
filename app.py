from aws_cdk import (
    aws_ec2 as ec2,
    core
)

class MyEc2Stack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Usar la VPC por defecto
        vpc = ec2.Vpc.from_lookup(self, "VPC", is_default=True)

        # Crear el grupo de seguridad
        security_group = ec2.SecurityGroup(
            self, 'InstanceSecurityGroup',
            vpc=vpc,
            description="Permitir trafico SSH y HTTP desde cualquier lugar",
            allow_all_outbound=True
        )

        # Reglas de ingreso para SSH y HTTP
        security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(22), "Permitir SSH")
        security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Permitir HTTP")

        # Crear la instancia EC2
        instance = ec2.Instance(self, "EC2Instance",
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ec2.MachineImage.generic_linux({
                "us-east-1": "ami-0aa28dab1f2852040"  # AMI específica
            }),
            vpc=vpc,
            security_group=security_group,
            key_name="vockey"
        )

        # Comando UserData para clonar repositorios y configurar el servidor web
        instance.add_user_data(
            "#!/bin/bash",
            "cd /var/www/html/",
            "git clone https://github.com/utec-cc-2024-2-test/websimple.git",
            "git clone https://github.com/utec-cc-2024-2-test/webplantilla.git",
            "ls -l"
        )

        # Outputs: IP Pública y URLs de los sitios web
        core.CfnOutput(self, "InstancePublicIP", value=instance.instance_public_ip)
        core.CfnOutput(self, "websimpleURL", value=f"http://{instance.instance_public_ip}/websimple")
        core.CfnOutput(self, "webplantillaURL", value=f"http://{instance.instance_public_ip}/webplantilla")

app = core.App()
MyEc2Stack(app, "MyEc2Stack")
app.synth()
