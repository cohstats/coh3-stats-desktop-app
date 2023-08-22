import { Tooltip, Image } from "@mantine/core";
import {calculatePlayerTier} from "../../utils/utils";


type Props = {
  size: number;
  rating: number;
  rank: number;
};

const RankIcon = ({ size, rank, rating }: Props) => {
  const rankTier = calculatePlayerTier(rank, rating);

  return (
    <>
      <Tooltip label={rankTier.name}>
        <Image src={rankTier.url} width={size} height={size} alt={rankTier.name}  />
      </Tooltip>
    </>
  );
};

export default RankIcon;
