import BridgeView from './BridgeView';

type Props = {
  params: Promise<{ address: string }>;
};

export default async function Page({ params }: Props) {
  const { address } = await params;
  return <BridgeView address={address} />;
}
