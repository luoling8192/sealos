import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  IconButton,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useMessage } from '@sealos/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBell,
  FaDownload,
  FaKey,
  FaSignOutAlt,
  FaUserCircle,
  FaWallet,
} from 'react-icons/fa';
import { createMasterAPP, masterApp } from 'sealos-desktop-sdk/master';
import IframeWindow from './iframe_window';
import { getGlobalNotification } from '@/api/platform';
import LangSelectSimple from '@/components/LangSelect/simple';
import PasswordModify from '@/components/account/PasswordModify';
import Notification from '@/components/notification';
import TeamCenter from '@/components/team/TeamCenter';
import WorkspaceToggle from '@/components/team/WorkspaceToggle';
import request from '@/services/request';
import useAppStore from '@/stores/app';
import { useConfigStore } from '@/stores/config';
import useSessionStore from '@/stores/session';
import type { ApiResp, TApp, WindowSize } from '@/types';
import download from '@/utils/downloadFIle';
import { formatMoney } from '@/utils/format';

export default function DesktopContent(props: any) {
  const { t, i18n } = useTranslation();
  const { installedApps: apps, runningInfo, openApp, setToHighestLayerById } = useAppStore();
  const logo = useConfigStore().layoutConfig?.logo;
  const renderApps = apps.filter((item: TApp) => item?.displayType === 'normal');
  const { message } = useMessage();

  const handleDoubleClick = (e: MouseEvent<HTMLButtonElement>, item: TApp) => {
    e.preventDefault();
    if (item?.name) {
      console.log(item);
      openApp(item);
    }
  };

  /**
   * Open Desktop Application
   *
   * @param {object} options - Options for opening the application
   * @param {string} options.appKey - Unique identifier key for the application
   * @param {object} [options.query={}] - Query parameter object
   * @param {object} [options.messageData={}] - Message data to be sent to the application
   * @param {string} options.pathname - Path when the application opens
   *
   * Logic:
   * - Find information about the application and its running state
   * - If the application does not exist, exit
   * - If the application is not open (not running), call the openApp method to open it
   * - If the application is already open (running), bring it to the highest layer
   * - Send a postMessage to the application window to handle the message data
   */
  const openDesktopApp = useCallback(
    ({
      appKey,
      query = {},
      messageData = {},
      pathname = '/',
      appSize = 'maximize',
    }: {
      appKey: string;
      query?: Record<string, string>;
      messageData?: Record<string, any>;
      pathname: string;
      appSize?: WindowSize;
    }) => {
      const app = apps.find(item => item.key === appKey);
      const runningApp = runningInfo.find(item => item.key === appKey);
      if (!app)
        return;
      openApp(app, { query, pathname, appSize });
      if (runningApp) {
        setToHighestLayerById(runningApp.pid);
      }
      // post message
      const iframe = document.getElementById(`app-window-${appKey}`) as HTMLIFrameElement;
      if (!iframe)
        return;
      iframe.contentWindow?.postMessage(messageData, app.data.url);
    },
    [apps, openApp, runningInfo, setToHighestLayerById],
  );

  useEffect(() => {
    return createMasterAPP();
  }, []);

  useEffect(() => {
    return masterApp?.addEventListen('openDesktopApp', openDesktopApp);
  }, [openDesktopApp]);

  useQuery(['getGlobalNotification'], getGlobalNotification, {
    onSuccess(data) {
      const newID = data.data?.metadata?.uid;
      if (!newID || newID === localStorage.getItem('GlobalNotification'))
        return;
      localStorage.setItem('GlobalNotification', newID);
      const title
        = i18n.language === 'zh' && data.data?.spec?.i18ns?.zh?.message
          ? data.data?.spec?.i18ns?.zh?.message
          : data.data?.spec?.message;
      message({
        title,
        status: 'info',
        duration: null,
      });
    },
  });

  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const { layoutConfig } = useConfigStore();
  const userInfo = useSessionStore(state => state.session);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  /**
   * Account
   */
  const [showId, setShowId] = useState(true);
  const passwordEnabled = useConfigStore().authConfig?.idp?.password?.enabled;
  const installApp = useAppStore(s => s.installedApps);

  const router = useRouter();
  const { delSession, session, setToken } = useSessionStore();
  const user = session?.user;
  const { data } = useQuery({
    queryKey: ['getAmount', { userId: user?.userCrUid }],
    queryFn: () =>
      request<any, ApiResp<{ balance: number; deductionBalance: number }>>(
        '/api/account/getAmount',
      ),
    enabled: !!user,
  });
  const balance = useMemo(() => {
    let real_balance = data?.data?.balance || 0;
    if (data?.data?.deductionBalance) {
      real_balance -= data?.data.deductionBalance;
    }
    return real_balance;
  }, [data]);
  const queryclient = useQueryClient();
  const kubeconfig = session?.kubeconfig || '';

  /**
   * Notification
   */
  const showNotification = useDisclosure();
  const [notificationAmount, setNotificationAmount] = useState(0);
  const onAmount = useCallback((amount: number) => setNotificationAmount(amount), []);

  return (
    <Flex h="100vh" bg="gray.100">
      <Notification disclosure={showNotification} onAmount={onAmount} />

      <Box
        w={isSidebarOpen ? '250px' : '60px'}
        bg="white"
        boxShadow="lg"
        transition="width 0.3s"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <HStack justifyContent="space-between" w="100%" p={4}>
          {isSidebarOpen && (
            <HStack>
              <Image src={logo} alt="Logo" h="36px" />
              {isSidebarOpen && <Heading size="md">{layoutConfig?.title || 'Sealos Cloud'}</Heading>}
            </HStack>
          )}
          <IconButton
            icon={isSidebarOpen ? <FaArrowLeft /> : <FaArrowRight />}
            onClick={toggleSidebar}
            variant="ghost"
            aria-label="Toggle sidebar"
          />
        </HStack>

        <Box overflowY="auto" overflowX="hidden" w="100%" flexGrow={1} px={4} pb={4} mr={-4}>
          <VStack
            spacing={1}
            mt={2}
            w="100%"
          >
            {renderApps.map((app, index) => (
              isSidebarOpen
                ? (
                  <Button
                    w="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    key={`menu-item-${app.key}-${index}`}
                    leftIcon={<Image src={app?.icon || logo} draggable={false} width="1.5rem" height="1.5rem" />}
                    onClick={e => handleDoubleClick(e, app)}
                  >
                    <Text fontSize="md" isTruncated maxW="180px">
                      {app?.i18n?.[i18n?.language]?.name
                        ? app?.i18n?.[i18n?.language]?.name
                        : t(app?.name)}
                    </Text>
                  </Button>
                  )
                : (
                  <IconButton
                    w="100%"
                    variant="ghost"
                    aria-label={app.name}
                    key={`menu-collapse-${app.key}-${index}`}
                    icon={<Image src={app?.icon || logo} draggable={false} width="24px" height="24px" />}
                    onClick={e => handleDoubleClick(e, app)}
                  />
                  )
            ))}
          </VStack>
        </Box>

        {isSidebarOpen && (
          <VStack w="100%" p={4}>
            <Popover>
              <PopoverTrigger>
                <HStack justifyContent="center" mt={1} cursor="pointer" userSelect="none">
                  <FaUserCircle size={isSidebarOpen ? '24px' : '1.5rem'} />
                  {isSidebarOpen && <Text fontSize="lg">{userInfo?.user.name}</Text>}
                </HStack>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverBody>
                  <VStack align="start" spacing={1} w="100%">
                    <TeamCenter>
                      <Button w="100%" justifyContent="flex-start" variant="ghost" leftIcon={<FaUserCircle />}>
                        <Text fontSize="md">{t('Manage Team')}</Text>
                      </Button>
                    </TeamCenter>

                    <Button
                      w="100%"
                      justifyContent="flex-start"
                      variant="ghost"
                      leftIcon={<FaWallet />}
                      onClick={() => {
                        const costcenter = installApp.find(t => t.key === 'system-costcenter');
                        if (!costcenter)
                          return;
                        openApp(costcenter);
                      }}
                    >
                      <Text fontSize="md">{`${t('Balance')}: ${formatMoney(balance).toFixed(2)}`}</Text>
                    </Button>

                    <Button
                      w="100%"
                      justifyContent="flex-start"
                      variant="ghost"
                      leftIcon={<FaDownload />}
                      onClick={() => kubeconfig && download('kubeconfig.yaml', kubeconfig)}
                    >
                      <Text fontSize="md">kubeconfig</Text>
                    </Button>

                    {passwordEnabled && (
                      <PasswordModify>
                        <Button w="100%" justifyContent="flex-start" variant="ghost" leftIcon={<FaKey />}>
                          <Text fontSize="md">{t('changePassword')}</Text>
                        </Button>
                      </PasswordModify>
                    )}

                    <Button
                      w="100%"
                      justifyContent="flex-start"
                      colorScheme="red"
                      variant="ghost"
                      leftIcon={<FaSignOutAlt />}
                      onClick={(e) => {
                        e.preventDefault();
                        delSession();
                        queryclient.clear();
                        router.replace('/signin');
                        setToken('');
                      }}
                    >
                      <Text fontSize="md">{t('Quit')}</Text>
                    </Button>

                    <HStack w="100%" justifyContent="center">
                      <Button variant="ghost">
                        <LangSelectSimple />
                      </Button>
                      <IconButton
                        icon={<FaBell />}
                        variant="ghost"
                        aria-label={t('Notification')}
                        onClick={() => showNotification.onOpen()}
                      />
                    </HStack>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <HStack w="100%" justifyContent="center" mt={1}>
              <WorkspaceToggle />
            </HStack>
          </VStack>
        )}
      </Box>

      <Box flex="1">
        {runningInfo.length > 0 && <IframeWindow pid={runningInfo[runningInfo.length - 1].pid} />}
      </Box>
    </Flex>
  );
}
