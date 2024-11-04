const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await ethers.provider.getBalance(lock.target)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});
const { expect } = require("chai");
const hre = require("hardhat");

describe("Digify", function () {
  let Digify;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await hre.ethers.getSigners();
    const Digify = await hre.ethers.getContractFactory("Digify");
    Digify = await Digify.deploy();
    await Digify.deployed();
  });

  it("Should create a new user", async function () {
    const basicInfo = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      homeAddress: "123 Main St",
      dateOfBirth: "1990-01-01",
      phoneNumber: "1234567890",
    };

    const professionalInfo = {
      education: "Harvard",
      workHistory: "Google, Microsoft",
      jobTitle: "Software Engineer",
      info: "Experienced developer",
      skills: ["Solidity", "JavaScript"],
      imageURL: "http://example.com/image.jpg",
    };

    const socialLinks = {
      x: "http://twitter.com/johndoe",
      instagram: "http://instagram.com/johndoe",
      tiktok: "http://tiktok.com/@johndoe",
      youtube: "http://youtube.com/johndoe",
      linkedin: "http://linkedin.com/in/johndoe",
    };

    const visibility = {
      education: true,
      workHistory: true,
      phoneNumber: true,
      homeAddress: true,
      dateOfBirth: true,
    };

    await Digify.createUser(
      "johndoe",
      basicInfo,
      professionalInfo,
      socialLinks,
      visibility
    );

    const user = await Digify.getUserByUsername("johndoe");
    expect(user.basicInfo.firstName).to.equal("John");
    expect(user.basicInfo.lastName).to.equal("Doe");
    expect(user.basicInfo.email).to.equal("john@example.com");
  });

  it("Should edit an existing user", async function () {
    const basicInfo = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      homeAddress: "123 Main St",
      dateOfBirth: "1990-01-01",
      phoneNumber: "1234567890",
    };

    const professionalInfo = {
      education: "Harvard",
      workHistory: "Google, Microsoft",
      jobTitle: "Software Engineer",
      info: "Experienced developer",
      skills: ["Solidity", "JavaScript"],
      imageURL: "http://example.com/image.jpg",
    };

    const socialLinks = {
      x: "http://twitter.com/johndoe",
      instagram: "http://instagram.com/johndoe",
      tiktok: "http://tiktok.com/@johndoe",
      youtube: "http://youtube.com/johndoe",
      linkedin: "http://linkedin.com/in/johndoe",
    };

    const visibility = {
      education: true,
      workHistory: true,
      phoneNumber: true,
      homeAddress: true,
      dateOfBirth: true,
    };

    await Digify.createUser(
      "johndoe",
      basicInfo,
      professionalInfo,
      socialLinks,
      visibility
    );

    // Edit user
    basicInfo.firstName = "Jane";
    basicInfo.lastName = "Smith";
    professionalInfo.jobTitle = "Product Manager";

    await Digify.editUser(
      "johndoe",
      basicInfo,
      professionalInfo,
      socialLinks,
      visibility
    );

    const user = await Digify.getUserByUsername("johndoe");
    expect(user.basicInfo.firstName).to.equal("Jane");
    expect(user.basicInfo.lastName).to.equal("Smith");
    expect(user.professionalInfo.jobTitle).to.equal("Product Manager");
  });

  it("Should fetch user data by address", async function () {
    const basicInfo = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      homeAddress: "123 Main St",
      dateOfBirth: "1990-01-01",
      phoneNumber: "1234567890",
    };

    const professionalInfo = {
      education: "Harvard",
      workHistory: "Google, Microsoft",
      jobTitle: "Software Engineer",
      info: "Experienced developer",
      skills: ["Solidity", "JavaScript"],
      imageURL: "http://example.com/image.jpg",
    };

    const socialLinks = {
      x: "http://twitter.com/johndoe",
      instagram: "http://instagram.com/johndoe",
      tiktok: "http://tiktok.com/@johndoe",
      youtube: "http://youtube.com/johndoe",
      linkedin: "http://linkedin.com/in/johndoe",
    };

    const visibility = {
      education: true,
      workHistory: true,
      phoneNumber: true,
      homeAddress: true,
      dateOfBirth: true,
    };

    await Digify
      .connect(user1)
      .createUser(
        "johndoe",
        basicInfo,
        professionalInfo,
        socialLinks,
        visibility
      );

    const user = await Digify.connect(user1).getUserByAddress(user1.address);
    expect(user.basicInfo.firstName).to.equal("John");
    expect(user.basicInfo.lastName).to.equal("Doe");
    expect(user.basicInfo.email).to.equal("john@example.com");
  });

  it("Should ensure the username is unique", async function () {
    const basicInfo = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      homeAddress: "123 Main St",
      dateOfBirth: "1990-01-01",
      phoneNumber: "1234567890",
    };

    const professionalInfo = {
      education: "Harvard",
      workHistory: "Google, Microsoft",
      jobTitle: "Software Engineer",
      info: "Experienced developer",
      skills: ["Solidity", "JavaScript"],
      imageURL: "http://example.com/image.jpg",
    };

    const socialLinks = {
      x: "http://twitter.com/johndoe",
      instagram: "http://instagram.com/johndoe",
      tiktok: "http://tiktok.com/@johndoe",
      youtube: "http://youtube.com/johndoe",
      linkedin: "http://linkedin.com/in/johndoe",
    };

    const visibility = {
      education: true,
      workHistory: true,
      phoneNumber: true,
      homeAddress: true,
      dateOfBirth: true,
    };

    await Digify.createUser(
      "johndoe",
      basicInfo,
      professionalInfo,
      socialLinks,
      visibility
    );

    await expect(
      Digify
        .connect(user2)
        .createUser(
          "johndoe",
          basicInfo,
          professionalInfo,
          socialLinks,
          visibility
        )
    ).to.be.revertedWith("Username already exists.");
  });

  it("Should set and get visibility settings", async function () {
    const basicInfo = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      homeAddress: "123 Main St",
      dateOfBirth: "1990-01-01",
      phoneNumber: "1234567890",
    };

    const professionalInfo = {
      education: "Harvard",
      workHistory: "Google, Microsoft",
      jobTitle: "Software Engineer",
      info: "Experienced developer",
      skills: ["Solidity", "JavaScript"],
      imageURL: "http://example.com/image.jpg",
    };

    const socialLinks = {
      x: "http://twitter.com/johndoe",
      instagram: "http://instagram.com/johndoe",
      tiktok: "http://tiktok.com/@johndoe",
      youtube: "http://youtube.com/johndoe",
      linkedin: "http://linkedin.com/in/johndoe",
    };

    const visibility = {
      education: true,
      workHistory: true,
      phoneNumber: true,
      homeAddress: true,
      dateOfBirth: true,
    };

    await Digify.createUser(
      "johndoe",
      basicInfo,
      professionalInfo,
      socialLinks,
      visibility
    );

    await Digify.setVisibility("johndoe", false, false, false, false, false);

    const updatedVisibility = await Digify.getVisibility("johndoe");
    expect(updatedVisibility.education).to.equal(false);
    expect(updatedVisibility.workHistory).to.equal(false);
    expect(updatedVisibility.phoneNumber).to.equal(false);
    expect(updatedVisibility.homeAddress).to.equal(false);
    expect(updatedVisibility.dateOfBirth).to.equal(false);
  });
});