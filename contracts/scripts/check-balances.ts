import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const yourWallet = "0xc5b7b574EE84A9B59B475FE32Eaf908C246d3859";
  const pasAddress = "0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a";
  const usdcAddress = "0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3";

  console.log("Checking balances...");
  console.log("");
  console.log(`Deployer wallet: ${deployer.address}`);
  console.log(`Your wallet:     ${yourWallet}`);
  console.log("");

  const pas = await ethers.getContractAt("MockERC20", pasAddress);
  const usdc = await ethers.getContractAt("MockERC20", usdcAddress);

  const deployerPas = await pas.balanceOf(deployer.address);
  const deployerUsdc = await usdc.balanceOf(deployer.address);
  const yourPas = await pas.balanceOf(yourWallet);
  const yourUsdc = await usdc.balanceOf(yourWallet);

  console.log("Deployer balances:");
  console.log(`  PAS:  ${ethers.formatEther(deployerPas)}`);
  console.log(`  USDC: ${ethers.formatUnits(deployerUsdc, 6)}`);
  console.log("");
  console.log("Your wallet balances:");
  console.log(`  PAS:  ${ethers.formatEther(yourPas)}`);
  console.log(`  USDC: ${ethers.formatUnits(yourUsdc, 6)}`);
  console.log("");

  // Transfer tokens to your wallet
  if (deployerPas > 0n) {
    console.log("Transferring PAS to your wallet...");
    const amount = ethers.parseEther("5000000"); // 5 million PAS
    await (await pas.transfer(yourWallet, amount)).wait();
    console.log(`✅ Transferred ${ethers.formatEther(amount)} PAS`);
  }

  if (deployerUsdc > 0n) {
    console.log("Transferring USDC to your wallet...");
    const amount = ethers.parseUnits("5000000", 6); // 5 million USDC
    await (await usdc.transfer(yourWallet, amount)).wait();
    console.log(`✅ Transferred ${ethers.formatUnits(amount, 6)} USDC`);
  }

  console.log("");
  console.log("Final balances:");
  const finalPas = await pas.balanceOf(yourWallet);
  const finalUsdc = await usdc.balanceOf(yourWallet);
  console.log(`Your PAS:  ${ethers.formatEther(finalPas)}`);
  console.log(`Your USDC: ${ethers.formatUnits(finalUsdc, 6)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
