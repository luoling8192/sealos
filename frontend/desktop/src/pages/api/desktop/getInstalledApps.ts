import type { NextApiRequest, NextApiResponse } from 'next'
import { K8sApi, ListCRD } from '@/services/backend/kubernetes/user'
import { jsonRes } from '@/services/backend/response'
import { CRDMeta, TAppCRList, TAppConfig } from '@/types'
import { getUserKubeconfigNotPatch } from '@/services/backend/kubernetes/admin'
import { verifyAccessToken } from '@/services/backend/auth'

import { switchKubeconfigNamespace } from '@/utils/switchKubeconfigNamespace'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  jsonRes(res, {
    data: [
      {
        'key': 'system-applaunchpad',
        'data': {
          'desc': 'App Launchpad',
          'url': 'https://applaunchpad.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '应用管理',
          },
          'zh-Hans': {
            'name': '应用管理',
          },
        },
        'icon': 'https://applaunchpad.sealos.bgp.st:443/logo.svg',
        'menuData': {
          'helpDropDown': false,
          'nameColor': 'text-black',
        },
        'name': 'App Launchpad',
        'type': 'iframe',
      },
      {
        'key': 'system-costcenter',
        'data': {
          'desc': 'sealos CLoud costcenter',
          'url': 'https://costcenter.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '费用中心',
          },
          'zh-Hans': {
            'name': '费用中心',
          },
        },
        'icon': 'https://costcenter.sealos.bgp.st:443/logo.svg',
        'menuData': {
          'helpDropDown': false,
          'nameColor': 'text-black',
        },
        'name': 'Cost Center',
        'type': 'iframe',
      },
      {
        'key': 'system-cronjob',
        'data': {
          'desc': 'CronJob',
          'url': 'https://cronjob.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '定时任务',
          },
          'zh-Hans': {
            'name': '定时任务',
          },
        },
        'icon': 'https://cronjob.sealos.bgp.st:443/logo.svg',
        'menuData': {
          'helpDropDown': false,
          'nameColor': 'text-black',
        },
        'name': 'CronJob',
        'type': 'iframe',
      },
      {
        'key': 'system-dbprovider',
        'data': {
          'desc': 'Database',
          'url': 'https://dbprovider.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '数据库',
          },
          'zh-Hans': {
            'name': '数据库',
          },
        },
        'icon': 'https://dbprovider.sealos.bgp.st:443/logo.svg',
        'menuData': {
          'helpDocs': 'https://sealos.run/docs/guides/dbprovider/config-docs/',
          'helpDropDown': false,
          'nameColor': 'text-black',
        },
        'name': 'Database',
        'type': 'iframe',
      },
      {
        'key': 'system-objectstorage',
        'data': {
          'desc': 'object storage',
          'url': 'https://objectstorage.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '对象存储',
          },
          'zh-Hans': {
            'name': '对象存储',
          },
        },
        'icon': 'https://objectstorage.sealos.bgp.st:443/logo.svg',
        'name': 'Object Storage',
        'type': 'iframe',
      },
      {
        'key': 'system-template',
        'data': {
          'url': 'https://template.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '应用商店',
          },
          'zh-Hans': {
            'name': '应用商店',
          },
        },
        'icon': 'https://template.sealos.bgp.st:443/logo.svg',
        'menuData': {
          'nameColor': 'text-black',
        },
        'name': 'App Store',
        'type': 'iframe',
      },
      {
        'key': 'system-terminal',
        'data': {
          'desc': 'sealos CLoud Terminal',
          'url': 'https://terminal.sealos.bgp.st:443',
        },
        'displayType': 'normal',
        'i18n': {
          'zh': {
            'name': '终端',
          },
          'zh-Hans': {
            'name': '终端',
          },
        },
        'icon': 'https://terminal.sealos.bgp.st:443/logo.svg',
        'menuData': {
          'helpDropDown': false,
          'nameColor': 'text-black',
        },
        'name': 'Terminal',
        'type': 'iframe',
      },
      {
        'key': 'user-bytebase-vpuutrka',
        'data': {
          'url': 'https://dbulmxdl.sealos.bgp.st',
        },
        'displayType': 'normal',
        'icon': 'https://raw.githubusercontent.com/bytebase/bytebase/main/frontend/src/assets/logo-icon.svg',
        'menuData': {
          'nameColor': 'text-black',
        },
        'name': 'bytebase-vpuutrka',
        'type': 'iframe',
      },
      {
        'key': 'user-dbgate-ofuzezhf',
        'data': {
          'url': 'https://dbgate-ydvfvaeq.sealos.bgp.st',
        },
        'displayType': 'normal',
        'icon': 'https://dbgate-ydvfvaeq.sealos.bgp.st/favicon.ico',
        'menuData': {
          'nameColor': 'text-black',
        },
        'name': 'dbgate-ofuzezhf',
        'type': 'iframe',
      },
      {
        'key': 'user-kuboard-amdgjuuy',
        'data': {
          'url': 'https://ggvoadgw.sealos.bgp.st',
        },
        'displayType': 'normal',
        'icon': 'https://kuboard.cn/favicon.png',
        'menuData': {
          'nameColor': 'text-black',
        },
        'name': 'kuboard-amdgjuuy',
        'type': 'iframe',
      },
      {
        'key': 'user-nocodb-sxsshrdt',
        'data': {
          'url': 'https://nocodb-pzpcyojr.sealos.bgp.st',
        },
        'displayType': 'normal',
        'icon': 'https://raw.githubusercontent.com/nocodb/nocodb/develop/packages/nc-gui/assets/img/brand/nocodb-logo.svg',
        'menuData': {
          'nameColor': 'text-black',
        },
        'name': 'nocodb-sxsshrdt',
        'type': 'iframe',
      },

    ],
  })

  // try {
  //   const payload = await verifyAccessToken(req.headers);
  //   if (!payload) return jsonRes(res, { code: 401, message: 'token is invaild' });
  //   const _kc = await getUserKubeconfigNotPatch(payload.userCrName);
  //   if (!_kc) return jsonRes(res, { code: 404, message: 'user is not found' });
  //   const realKc = switchKubeconfigNamespace(_kc, payload.workspaceId);
  //   const kc = K8sApi(realKc);
  //   const getMeta = (namespace = 'app-system') => ({
  //     group: 'app.sealos.io',
  //     version: 'v1',
  //     namespace,
  //     plural: 'apps'
  //   });
//
  //   const getRawAppList = async (meta: CRDMeta) =>
  //     ((await ListCRD(kc, meta)).body as TAppCRList).items || [];
//
  //   const defaultArr = (await getRawAppList(getMeta())).map<TAppConfig>((item) => {
  //     return { key: `system-${item.metadata.name}`, ...item.spec };
  //   });
//
  //   const userArr = (await getRawAppList(getMeta(payload.workspaceId))).map<TAppConfig>((item) => {
  //     return { key: `user-${item.metadata.name}`, ...item.spec, displayType: 'normal' };
  //   });
//
  //   let apps = [...defaultArr, ...userArr].filter((item) => item.displayType !== 'hidden');
//
  //   jsonRes(res, { data: apps });
  // } catch (err) {
  //   console.log(err);
  //   jsonRes(res, { code: 500, data: err });
  // }
}
