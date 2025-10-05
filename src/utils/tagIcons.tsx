import { 
  IconRun, 
  IconBike, 
  IconMountain, 
  IconBallFootball, 
  IconPlant, 
  IconSun,
  IconCamera,
  IconLungs,
  IconHeart,
  IconUsers,
  IconUserCheck,
  IconUser,
  IconBriefcase,
  IconPaw,
  IconCar,
  IconFlower,
  IconFlame,
  IconBuilding,
  IconMist,
  IconCloudRain,
  IconActivity
} from '@tabler/icons-react';

// Map tag names to their corresponding icons
export const getTagIcon = (tagName: string, tagType: string) => {
  const iconProps = { size: 16, stroke: 1.5 };
  
  // Outdoor Activities
  if (tagName.toLowerCase().includes('running')) return <IconRun {...iconProps} />;
  if (tagName.toLowerCase().includes('cycling')) return <IconBike {...iconProps} />;
  if (tagName.toLowerCase().includes('hiking')) return <IconMountain {...iconProps} />;
  if (tagName.toLowerCase().includes('sports')) return <IconBallFootball {...iconProps} />;
  if (tagName.toLowerCase().includes('gardening') || tagName.toLowerCase().includes('patio')) return <IconPlant {...iconProps} />;
  if (tagName.toLowerCase().includes('picnic') || tagName.toLowerCase().includes('field')) return <IconSun {...iconProps} />;
  if (tagName.toLowerCase().includes('photography')) return <IconCamera {...iconProps} />;
  
  // Vulnerability and Health
  if (tagName.toLowerCase().includes('asthma') || tagName.toLowerCase().includes('respiratory')) return <IconLungs {...iconProps} />;
  if (tagName.toLowerCase().includes('cardiovascular') || tagName.toLowerCase().includes('heart')) return <IconHeart {...iconProps} />;
  if (tagName.toLowerCase().includes('elderly')) return <IconUsers {...iconProps} />;
  if (tagName.toLowerCase().includes('children') || tagName.toLowerCase().includes('parents')) return <IconUserCheck {...iconProps} />;
  if (tagName.toLowerCase().includes('pregnancy')) return <IconUser {...iconProps} />;
  
  // Occupation and Lifestyle
  if (tagName.toLowerCase().includes('worker')) return <IconBriefcase {...iconProps} />;
  if (tagName.toLowerCase().includes('pet')) return <IconPaw {...iconProps} />;
  if (tagName.toLowerCase().includes('traveler') || tagName.toLowerCase().includes('traffic')) return <IconCar {...iconProps} />;
  if (tagName.toLowerCase().includes('allergy')) return <IconFlower {...iconProps} />;
  
  // Pollutant Interests
  if (tagName.toLowerCase().includes('wildfire')) return <IconFlame {...iconProps} />;
  if (tagName.toLowerCase().includes('industrial')) return <IconBuilding {...iconProps} />;
  if (tagName.toLowerCase().includes('pm2.5') || tagName.toLowerCase().includes('particles')) return <IconMist {...iconProps} />;
  if (tagName.toLowerCase().includes('ozone')) return <IconCloudRain {...iconProps} />;
  
  // Default icon based on category
  switch (tagType) {
    case 'Outdoor Activities':
      return <IconActivity {...iconProps} />;
    case 'Vulnerability and Health':
      return <IconHeart {...iconProps} />;
    case 'Occupation and Lifestyle':
      return <IconBriefcase {...iconProps} />;
    case 'Pollutant Interests':
      return <IconMist {...iconProps} />;
    default:
      return <IconActivity {...iconProps} />;
  }
};

// Get category color classes
export const getCategoryColor = (tagType: string) => {
  switch (tagType) {
    case 'Outdoor Activities':
      return {
        bg: 'bg-green-50 hover:bg-green-100 border-green-200',
        text: 'text-green-700',
        selectedBg: 'bg-green-100 border-green-300',
        selectedText: 'text-green-800'
      };
    case 'Vulnerability and Health':
      return {
        bg: 'bg-red-50 hover:bg-red-100 border-red-200',
        text: 'text-red-700',
        selectedBg: 'bg-red-100 border-red-300',
        selectedText: 'text-red-800'
      };
    case 'Occupation and Lifestyle':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        text: 'text-blue-700',
        selectedBg: 'bg-blue-100 border-blue-300',
        selectedText: 'text-blue-800'
      };
    case 'Pollutant Interests':
      return {
        bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        text: 'text-purple-700',
        selectedBg: 'bg-purple-100 border-purple-300',
        selectedText: 'text-purple-800'
      };
    default:
      return {
        bg: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
        text: 'text-gray-700',
        selectedBg: 'bg-gray-100 border-gray-300',
        selectedText: 'text-gray-800'
      };
  }
};
