import { ethers } from "hardhat";

async function main() {
  const yourWallet = "0xc5b7b574EE84A9B59B475FE32Eaf908C246d3859";
  const pasAddress = "0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a";
  const usdcAddress = "0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3";

  console.log("Testing balance reads from browser perspective...");
  console.log("");

  const pas = await ethers.getContractAt("IERC20", pasAddress);
  const usdc = await ethers.getContractAt("IERC20", usdcAddress);

  const pasBalance = await pas.balanceOf(yourWallet);
  const usdcBalance = await usdc.balanceOf(yourWallet);

  console.log(`Wallet: ${yourWallet}`);
  console.log(`PAS:  ${ethers.formatEther(pasBalance)} (${pasBalance.toString()} wei)`);
  console.log(`USDC: ${ethers.formatUnits(usdcBalance, 6)} (${usdcBalance.toString()} smallest units)`);
  console.log("");
  console.log("✅ Balance reads work correctly!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
