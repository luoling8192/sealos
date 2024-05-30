import { getGlobalNotification } from '@/api/platform'
import useAppStore from '@/stores/app'
import { useConfigStore } from '@/stores/config'
import { TApp, WindowSize } from '@/types'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FaArrowLeft, FaArrowRight, FaDownload, FaSignOutAlt, FaUserCircle, FaWallet } from 'react-icons/fa'
import { useMessage } from '@sealos/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { MouseEvent, useCallback, useEffect, useState } from 'react'
import { createMasterAPP, masterApp } from 'sealos-desktop-sdk/master'
import IframeWindow from './iframe_window'
import useSessionStore from '@/stores/session'
import LangSelectSimple from '@/components/LangSelect/simple'

export default function DesktopContent(props: any) {
  const { t, i18n } = useTranslation()
  const { installedApps: apps, runningInfo, openApp, setToHighestLayerById } = useAppStore()
  const backgroundImage = useConfigStore().layoutConfig?.backgroundImage
  const logo = useConfigStore().layoutConfig?.logo
  const renderApps = apps.filter((item: TApp) => item?.displayType === 'normal')
  const [maxItems, setMaxItems] = useState(10)
  const { message } = useMessage()

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>, item: TApp) => {
    e.preventDefault()
    if (item?.name) {
      console.log(item)
      openApp(item)
    }
  }

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
      const app = apps.find((item) => item.key === appKey)
      const runningApp = runningInfo.find((item) => item.key === appKey)
      if (!app) return
      openApp(app, { query, pathname, appSize })
      if (runningApp) {
        setToHighestLayerById(runningApp.pid)
      }
      // post message
      const iframe = document.getElementById(`app-window-${appKey}`) as HTMLIFrameElement
      if (!iframe) return
      iframe.contentWindow?.postMessage(messageData, app.data.url)
    },
    [apps, openApp, runningInfo, setToHighestLayerById],
  )

  useEffect(() => {
    return createMasterAPP()
  }, [])

  useEffect(() => {
    return masterApp?.addEventListen('openDesktopApp', openDesktopApp)
  }, [openDesktopApp])

  useQuery(['getGlobalNotification'], getGlobalNotification, {
    onSuccess(data) {
      const newID = data.data?.metadata?.uid
      if (!newID || newID === localStorage.getItem('GlobalNotification')) return
      localStorage.setItem('GlobalNotification', newID)
      const title =
        i18n.language === 'zh' && data.data?.spec?.i18ns?.zh?.message
          ? data.data?.spec?.i18ns?.zh?.message
          : data.data?.spec?.message
      message({
        title: title,
        status: 'info',
        duration: null,
      })
    },
  })

  const [isSidebarOpen, setSidebarOpen] = useState(true)

  const { layoutConfig } = useConfigStore()
  const userInfo = useSessionStore((state) => state.session)

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen)
  }

  return (
    <Flex minH="100vh" bg="gray.100">
      {/* Sidebar */}
      <Box
        w={isSidebarOpen ? '250px' : '60px'}
        bg="white"
        p={4}
        boxShadow="lg"
        transition="width 0.3s"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <VStack align="start" spacing={4}>
          <HStack justifyContent="space-between" w="100%">
            {isSidebarOpen &&
                <HStack spacing={3}>
                    <Image src={'/logo.svg'} alt="Logo" h="40px"/>
                  {isSidebarOpen && <Heading size="md">{layoutConfig?.title || 'Sealos Cloud'}</Heading>}
                </HStack>
            }
            <IconButton
              icon={isSidebarOpen ? <FaArrowLeft/> : <FaArrowRight/>}
              onClick={toggleSidebar}
              variant="ghost"
              aria-label="Toggle sidebar"
            />
          </HStack>
          <VStack spacing={1} mt={4} w="100%">
            {renderApps.map((app) => (
              isSidebarOpen ?
                <Button
                  w="100%"
                  justifyContent="flex-start"
                  variant="ghost"
                  key={app.key}
                  leftIcon={<Image src={app?.icon || '/logo.svg'} draggable={false} width="16px" height="16px"/>}
                  onClick={(e) => handleDoubleClick(e, app)}
                >
                  <Text fontSize="md">{app?.name || 'App'}</Text>
                </Button>
                :
                <IconButton
                  w="100%"
                  variant="ghost"
                  key={app.key}
                  aria-label={app.name}
                  leftIcon={<Image src={app?.icon || '/logo.svg'} draggable={false} width="16px" height="16px"/>}
                  onClick={(e) => handleDoubleClick(e, app)}
                />
            ))}
          </VStack>
        </VStack>
        <Popover>
          <PopoverTrigger>
            <HStack justifyContent="center" spacing={3} mt="auto" mb={4} cursor="pointer">
              <FaUserCircle size={isSidebarOpen ? '24px' : '36px'}/>
              {isSidebarOpen && <Text>{userInfo?.user.name}</Text>}
            </HStack>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow/>
            <PopoverBody>
              <VStack align="start" spacing={1} w="100%">
                <Button w="100%" justifyContent="flex-start" variant="ghost" leftIcon={<FaUserCircle/>}>
                  <Text fontSize="md">{t('Manage Team')}</Text>
                </Button>
                <Button w="100%" justifyContent="flex-start" variant="ghost" leftIcon={<FaWallet/>}>
                  <Text fontSize="md">{t('Balance')}</Text>
                </Button>
                <Button w="100%" justifyContent="flex-start" variant="ghost" leftIcon={<FaDownload/>}>
                  <Text fontSize="md">kubeconfig</Text>
                </Button>
                <Button
                  w="100%"
                  justifyContent="flex-start"
                  colorScheme="red"
                  variant="ghost"
                  leftIcon={<FaSignOutAlt/>}
                >
                  <Text fontSize="md">{t('Quit')}</Text>
                </Button>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        <Button>
          <LangSelectSimple/>
        </Button>
      </Box>

      {/* Main Content */}
      <Box flex="1">
        {/* Running Apps */}
        {runningInfo.map((process) => (
          <IframeWindow key={process.pid} pid={process.pid}/>
        ))}
      </Box>
    </Flex>
  )
}
