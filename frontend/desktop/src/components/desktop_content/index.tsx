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
import {
  FaArrowLeft,
  FaArrowRight,
  FaChartBar,
  FaClipboardList,
  FaCog,
  FaDownload,
  FaNetworkWired,
  FaRocket,
  FaSignOutAlt,
  FaTicketAlt,
  FaUserCircle,
  FaUsers,
  FaWallet,
} from 'react-icons/fa'
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

  const menuItems = renderApps.length > 0 ? renderApps.map((app: TApp) => ({
    ...app,
    label: app.i18n?.[i18n.language]?.name || t(app.name),
    // icon: FaRocket, //<Image src={app?.icon || '/logo.svg'} />,
  })) : [
    { label: 'Dashboard', icon: FaRocket },
    { label: 'Forward', icon: FaRocket },
    { label: 'Agent', icon: FaUserCircle },
    { label: 'Network', icon: FaNetworkWired },
    { label: 'Ticket', icon: FaTicketAlt },
    { label: 'Users', icon: FaUsers },
    { label: 'Statistics', icon: FaChartBar },
    { label: 'Log', icon: FaClipboardList },
    { label: 'Config', icon: FaCog },
  ]

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

// <Box
//   id="desktop"
//   className={styles.desktop}
//   backgroundImage={`url(${backgroundImage || '/images/bg-blue.jpg'})`}
//   backgroundRepeat={'no-repeat'}
//   backgroundSize={'cover'}
// >
//   <Flex w="100%" h="100%" alignItems={'center'} flexDirection={'column'}>
//     <Box mt="12vh" minW={'508px'}>
//       <TimeComponent />
//     </Box>
//     {showGuide ? (
//       <>
//         <UserGuide />
//         <Box
//           position="fixed"
//           top="0"
//           left="0"
//           width="100%"
//           height="100%"
//           backgroundColor="rgba(0, 0, 0, 0.7)" // 半透明黑色背景
//           zIndex="11000" // 保证蒙层在最上层
//         />
//       </>
//     ) : (
//       <></>
//     )}
//     {/* desktop apps */}
//     <Grid
//       mt="50px"
//       minW={'508px'}
//       maxH={'300px'}
//       templateRows={'repeat(2, 100px)'}
//       templateColumns={'repeat(5, 72px)'}
//       gap={'36px'}
//     >
//       {renderApps &&
//         renderApps.slice(0, maxItems).map((item: TApp, index) => (
//           <GridItem
//             w="72px"
//             h="100px"
//             key={index}
//             userSelect="none"
//             cursor={'pointer'}
//             onClick={(e) => handleDoubleClick(e, item)}
//           >
//             <Box
//               className={item.key}
//               w="72px"
//               h="72px"
//               p={'12px'}
//               border={'1px solid #FFFFFF'}
//               borderRadius={8}
//               boxShadow={'0px 1.16667px 2.33333px rgba(0, 0, 0, 0.2)'}
//               backgroundColor={'rgba(244, 246, 248, 0.9)'}
//             >
//               <Image
//                 width="100%"
//                 height="100%"
//                 src={item?.icon}
//                 fallbackSrc={logo || '/logo.svg'}
//                 draggable={false}
//                 alt="user avator"
//               />
//             </Box>
//             <Text
//               textShadow={'0px 1px 2px rgba(0, 0, 0, 0.4)'}
//               textAlign={'center'}
//               mt="8px"
//               color={'#FFFFFF'}
//               fontSize={'13px'}
//               lineHeight={'16px'}
//             >
//               {item?.i18n?.[i18n?.language]?.name
//                 ? item?.i18n?.[i18n?.language]?.name
//                 : t(item?.name)}
//             </Text>
//           </GridItem>
//         ))}
//     </Grid>
//     <MoreButton />
//     <UserMenu />
//   </Flex>
//   {/* opened apps */}
//   {runningInfo.map((process) => {
//     return (
//       <AppWindow key={process.pid} style={{ height: '100vh' }} pid={process.pid}>
//         <IframeWindow pid={process.pid} />
//       </AppWindow>
//     );
//   })}
// </Box>
