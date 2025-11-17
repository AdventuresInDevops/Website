const stackProvider = {
  getStack({ requestInterceptorLambdaFunctionString}) {
    return {
      AWSTemplateFormatVersion: '2010-09-09',
      Parameters: {
        hostedName: {
          Type: 'String',
          Description: 'Base path to add to DNS Name.'
        },
        hostedZoneId: {
          Type: 'String',
          Description: 'The hosted zone id for the domain'
        },
        serviceName: {
          Type: 'String',
          Description: 'The name of this service'
        },
        serviceDescription: {
          Type: 'String',
          Description: 'Helpful description for the service'
        }
      },

      Resources: {
        S3Bucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { Ref: 'hostedName' },
            Tags: [
              {
                Key: 'Service',
                Value: { Ref: 'hostedName' }
              }
            ],
            LifecycleConfiguration: {
              Rules: [{
                Id: 'delete-incomplete-mpu-7days',
                Prefix: '',
                AbortIncompleteMultipartUpload: {
                  DaysAfterInitiation: 7
                },
                Status: 'Enabled'
              }]
            }
          }
        },

        AudioStorageBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': 'storage.${hostedName}' },
            Tags: [
              {
                Key: 'Service',
                Value: { Ref: 'hostedName' }
              }
            ],
            LifecycleConfiguration: {
              Rules: [{
                Id: 'delete-incomplete-mpu-7days',
                Prefix: '',
                AbortIncompleteMultipartUpload: {
                  DaysAfterInitiation: 7
                },
                Status: 'Enabled'
              }]
            }
          }
        },

        CloudFrontOriginAccessControl: {
          Type: 'AWS::CloudFront::OriginAccessControl',
          Properties: {
            OriginAccessControlConfig: {
              Description: { 'Fn::Sub': 'Access to S3 bucket for ${hostedName}' },
              Name: { Ref: 'hostedName' },
              OriginAccessControlOriginType: 's3',
              SigningBehavior: 'always',
              SigningProtocol: 'sigv4'
            }
          }
        },

        S3BucketPolicy: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'hostedName' },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'Grant a CloudFront Origin Identity access to support private content',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudfront.amazonaws.com'
                  },
                  Action: 's3:GetObject',
                  Resource: [
                    { 'Fn::Sub': '${S3Bucket.Arn}/*' }
                  ],
                  Condition: {
                    StringLike: {
                      'AWS:SourceArn': { 'Fn::Sub': 'arn:aws:cloudfront::${AWS::AccountId}:distribution/*' }
                    }
                  }
                }
              ]
            }
          }
        },

        AudioStorageBucketPolicy: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { 'Fn::Sub': 'storage.${hostedName}' },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'Grant a CloudFront Origin Identity access to support private content',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudfront.amazonaws.com'
                  },
                  Action: 's3:GetObject',
                  Resource: [
                    { 'Fn::Sub': '${AudioStorageBucket.Arn}/*' }
                  ],
                  Condition: {
                    StringLike: {
                      'AWS:SourceArn': { 'Fn::Sub': 'arn:aws:cloudfront::${AWS::AccountId}:distribution/*' }
                    }
                  }
                }
              ]
            }
          }
        },

        AcmCertificate: {
          Type: 'AWS::CertificateManager::Certificate',
          Properties: {
            DomainName: { 'Fn::Sub': '${hostedName}' },
            SubjectAlternativeNames: [
              { 'Fn::Sub': '${hostedName}' },
              { 'Fn::Sub': '*.${hostedName}' }
            ],
            ValidationMethod: 'DNS',
            DomainValidationOptions: [{
              DomainName: { 'Fn::Sub': '${hostedName}' },
              HostedZoneId: { Ref: 'hostedZoneId' }
            }]
          }
        },

        RequestInterceptorLambdaCfFunction: {
          Type: 'AWS::CloudFront::Function',
          Properties: {
            Name: { 'Fn::Sub': '${AWS::StackName}-RequestInterceptor' },
            AutoPublish: true,
            FunctionCode: requestInterceptorLambdaFunctionString,
            FunctionConfig: {
              Comment: { 'Fn::Sub': '${AWS::StackName}-RequestInterceptor' },
              Runtime: 'cloudfront-js-2.0',
              KeyValueStoreAssociations: [{
                KeyValueStoreARN: { 'Fn::Sub': '${RedirectMap.Arn}' }
              }]
            }
          }
        },

        LambdaFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            FunctionName: { Ref: 'serviceName' },
            Description: { Ref: 'serviceDescription' },
            Handler: 'index.handler',
            Runtime: 'nodejs20.x',
            TracingConfig: {
              Mode: 'PassThrough'
            },
            Code: {
              ZipFile: 'exports.handler = async() => Promise.resolve()'
            },
            // https://docs.aws.amazon.com/lambda/latest/dg/configuration-function-common.html
            MemorySize: 128,
            Timeout: 900,
            Role: { 'Fn::GetAtt': ['LambdaRole', 'Arn'] },
            Tags: [{ Key: 'ServiceAPI', Value: { Ref: 'serviceName' } }]
          }
        },
        LambdaFunctionVersion: {
          Type: 'AWS::Lambda::Version',
          Properties: {
            FunctionName: { Ref: 'LambdaFunction' },
            Description: 'Initial Production Deployed Version'
          }
        },
        ProductionAlias: {
          Type: 'AWS::Lambda::Alias',
          Properties: {
            Description: 'The production alias',
            FunctionName: { 'Fn::GetAtt': ['LambdaFunction', 'Arn'] },
            FunctionVersion: { 'Fn::GetAtt': ['LambdaFunctionVersion', 'Version'] },
            Name: 'production'
          }
        },
        LambdaRole: {
          Type: 'AWS::IAM::Role',
          Properties: {
            RoleName: { 'Fn::Sub': '${serviceName}LambdaRole' },
            MaxSessionDuration: 43200,
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: ['lambda.amazonaws.com']
                  },
                  Action: ['sts:AssumeRole']
                }
              ]
            },
            ManagedPolicyArns: [
              'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess'
            ],
            Policies: [
              {
                PolicyName: 'MicroservicePolicy',
                PolicyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Sid: 'SQSReader',
                      Effect: 'Allow',
                      Action: 'sqs:*',
                      Resource: { 'Fn::Sub': 'arn:aws:sqs:*:*:${serviceName}-*' }
                    },
                    {
                      Sid: 'S3Reader',
                      Effect: 'Allow',
                      Action: 's3:getObject',
                      Resource: { 'Fn::Sub': '${CloudFrontLoggingBucket.Arn}/*' }
                    }
                  ]
                }
              }
            ],
            Path: '/'
          }
        },

        CloudWatchLambdaLogGroup: {
          Type: 'AWS::Logs::LogGroup',
          Properties: {
            LogGroupName: { 'Fn::Sub': '/aws/lambda/${serviceName}' },
            RetentionInDays: 365
          }
        },

        CloudFrontLoggingBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': '${hostedName}.logs' },
            AccessControl: 'BucketOwnerFullControl',
            OwnershipControls: {
              Rules: [{ ObjectOwnership: 'BucketOwnerPreferred' }]
            },
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,
              BlockPublicPolicy: true,
              IgnorePublicAcls: true,
              RestrictPublicBuckets: true
            },
            LifecycleConfiguration: {
              Rules: [{
                Id: 'Delete old objects',
                Status: 'Enabled',
                AbortIncompleteMultipartUpload: { DaysAfterInitiation: 30 },
                ExpirationInDays: 60,
                NoncurrentVersionExpirationInDays: 30
              }]
            },
            NotificationConfiguration: {
              QueueConfigurations: [
                {
                  Event: 's3:ObjectCreated:*',
                  Queue: { 'Fn::Sub': '${LogProcessingSQS.Arn}' }
                }
              ]
            },
            Tags: [
              {
                Key: 'Service',
                Value: { Ref: 'serviceName' }
              }
            ]
          }
        },

        LogProcessingSQS: {
          Type: 'AWS::SQS::Queue',
          Properties: {
            QueueName: { 'Fn::Sub': '${serviceName}-LogProcessing-prod' },
            MessageRetentionPeriod: 1209600,
            // Set to more than twice the length of the lambda function timeout
            VisibilityTimeout: 2000,
            ReceiveMessageWaitTimeSeconds: 20
          }
        },

        PermissionForLogBucketToPublishToSQSQueue: {
          Type: 'AWS::SQS::QueuePolicy',
          Properties: {
            PolicyDocument: {
              Id: 'LogBucketQueuePolicy',
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'LogBucketAllowPublishToSQS',
                  Effect: 'Allow',
                  Principal: { Service: 's3.amazonaws.com' },
                  Action: ['SQS:SendMessage'],
                  Resource: { 'Fn::GetAtt': ['LogProcessingSQS', 'Arn'] },
                  Condition: { ArnLike: { 'aws:SourceArn': { 'Fn::Sub': 'arn:aws:s3:::${hostedName}.logs' } } }
                }
              ]
            },
            Queues: [{ Ref: 'LogProcessingSQS' }]
          }
        },

        // Disable for the moment
        // LogProcessingEventSourceMapping: {
        //   Type: 'AWS::Lambda::EventSourceMapping',
        //   Properties: {
        //     BatchSize: 10,
        //     Enabled: true,
        //     EventSourceArn: { 'Fn::Sub': '${LogProcessingSQS.Arn}' },
        //     FunctionName: { Ref: 'ProductionAlias' },
        //     FunctionResponseTypes: ['ReportBatchItemFailures']
        //   }
        // },

        RedirectMap: {
          Type: 'AWS::CloudFront::KeyValueStore',
          Properties: {
            Name: { 'Fn::Sub': '${serviceName}-RedirectMap' },
            Comment: 'KB KeyStore to house redirect map for SEO redirects.'
          }
        },

        CloudFrontLoggingBucketPolicy: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'CloudFrontLoggingBucket' },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontToPutLogs',
                  Effect: 'Allow',
                  Principal: {
                    // The CloudFront logging infra ID
                    CanonicalUser: 'c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0'
                  },
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl'
                  ],
                  Resource: { 'Fn::Sub': '${CloudFrontLoggingBucket.Arn}/*' },
                  Condition: {
                    StringLike: {
                      'AWS:SourceArn': { 'Fn::Sub': 'arn:aws:cloudfront::${AWS::AccountId}:distribution/*' }
                    }
                  }
                }
              ]
            }
          }
        },

        CloudFrontDistribution: {
          Type: 'AWS::CloudFront::Distribution',
          DependsOn: ['CloudFrontLoggingBucketPolicy'],
          Properties: {
            Tags: [{ Key: 'Name', Value: { Ref: 'AWS::StackName' } }],
            DistributionConfig: {
              Comment: { Ref: 'AWS::StackName' },
              DefaultRootObject: 'index.html',
              Aliases: [
                { 'Fn::Sub': 'links.${hostedName}' },
                { Ref: 'hostedName' }
              ],
              Logging: {
                Bucket: { 'Fn::GetAtt': ['CloudFrontLoggingBucket', 'DomainName'] },
                IncludeCookies: true,
                Prefix: 'CloudFrontAccessLogs/'
              },
              HttpVersion: 'http2and3',
              PriceClass: 'PriceClass_100',
              Origins: [
                {
                  OriginPath: '/v2',
                  DomainName: { 'Fn::Sub': '${hostedName}.s3.amazonaws.com' },
                  Id: 'S3',
                  OriginAccessControlId: { 'Fn::Sub': '${CloudFrontOriginAccessControl.Id}' },
                  S3OriginConfig: {}
                },
                {
                  DomainName: { 'Fn::Sub': 'storage.${hostedName}.s3.amazonaws.com' },
                  Id: 'STORAGE',
                  OriginAccessControlId: { 'Fn::Sub': '${CloudFrontOriginAccessControl.Id}' },
                  S3OriginConfig: {}
                },
                {
                  DomainName: { 'Fn::Sub': '${hostedName}.s3.amazonaws.com' },
                  Id: 'TST-S3',
                  OriginAccessControlId: { 'Fn::Sub': '${CloudFrontOriginAccessControl.Id}' },
                  S3OriginConfig: {}
                }
              ],
              Enabled: true,
              ViewerCertificate: {
                AcmCertificateArn: { Ref: 'AcmCertificate' },
                MinimumProtocolVersion: 'TLSv1.2_2021',
                SslSupportMethod: 'sni-only'
              },
              DefaultCacheBehavior: {
                AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                Compress: true,
                CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
                OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
                TargetOriginId: 'S3',
                ViewerProtocolPolicy: 'redirect-to-https',
                FunctionAssociations: [{
                  EventType: 'viewer-request',
                  FunctionARN: { 'Fn::Sub': '${RequestInterceptorLambdaCfFunction.FunctionARN}' }
                }]
              },
              CacheBehaviors: [
                {
                  AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                  Compress: true,
                  CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
                  OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
                  PathPattern: 'PR-*',
                  TargetOriginId: { 'Fn::Sub': 'TST-S3' },
                  ViewerProtocolPolicy: 'redirect-to-https'
                },
                {
                  AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                  Compress: true,
                  CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
                  OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
                  PathPattern: 'storage',
                  TargetOriginId: 'STORAGE',
                  ViewerProtocolPolicy: 'redirect-to-https'
                }
              ],
              CustomErrorResponses: [
                {
                  ErrorCode: 403,
                  ErrorCachingMinTTL: 300,
                  ResponseCode: 200,
                  ResponsePagePath: '/index.html'
                },
                {
                  ErrorCode: 404,
                  ErrorCachingMinTTL: 300,
                  ResponseCode: 200,
                  ResponsePagePath: '/index.html'
                }
              ]
            }
          }
        },

        ProdRoute53: {
          Type: 'AWS::Route53::RecordSet',
          Properties: {
            HostedZoneId: { Ref: 'hostedZoneId' },
            Name: { 'Fn::Sub': 'links.${hostedName}.' },
            AliasTarget: {
              DNSName: { 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] },
              HostedZoneId: 'Z2FDTNDATAQYW2'
            },
            Type: 'A'
          }
        },

        ProdRoute53Ipv6: {
          Type: 'AWS::Route53::RecordSet',
          Properties: {
            HostedZoneId: { Ref: 'hostedZoneId' },
            Name: { 'Fn::Sub': 'links.${hostedName}.' },
            AliasTarget: {
              DNSName: { 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] },
              HostedZoneId: 'Z2FDTNDATAQYW2'
            },
            Type: 'AAAA'
          }
        },

        GitHubIpv4ARecords: {
          Type: 'AWS::Route53::RecordSet',
          Properties: {
            HostedZoneId: { Ref: 'hostedZoneId' },
            Name: { 'Fn::Sub': '${hostedName}.' },
            Type: 'A',
            TTL: '3600',
            ResourceRecords: [
              '185.199.108.153',
              '185.199.109.153',
              '185.199.110.153',
              '185.199.111.153'
            ]
          }
        },

        GitHubIpv6AAAARecords: {
          Type: 'AWS::Route53::RecordSet',
          Properties: {
            HostedZoneId: { Ref: 'hostedZoneId' },
            Name: { 'Fn::Sub': '${hostedName}.' },
            Type: 'AAAA',
            TTL: '3600',
            ResourceRecords: [
              '2606:50c0:8000::153',
              '2606:50c0:8001::153',
              '2606:50c0:8002::153',
              '2606:50c0:8003::153'
            ]
          }
        },
        GitHubWWWRedirect: {
          Type: 'AWS::Route53::RecordSet',
          Properties: {
            HostedZoneId: { Ref: 'hostedZoneId' },
            Name: { 'Fn::Sub': 'www.${hostedName}.' },
            Type: 'CNAME',
            TTL: '300',
            ResourceRecords: ['adventuresindevops.github.io']
          }
        },
      }
    };
  }
};

export default stackProvider;
