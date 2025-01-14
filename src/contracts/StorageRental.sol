// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StorageRental {
    struct StorageSpace {
        uint256 totalSpace;      // Total space in GB
        uint256 availableSpace;  // Available space in GB
        uint256 pricePerGB;
        address owner;
    }

    struct Rental {
        uint256 spaceId;
        uint256 rentedSpace;     // Amount of GB rented
        uint256 rentedUntil;
        bool isActive;
    }

    mapping(uint256 => StorageSpace) public storageSpaces;
    mapping(address => Rental[]) public userRentals;
    uint256 public nextStorageId;
    
    event StorageAdded(uint256 indexed spaceId, uint256 totalSpace, uint256 pricePerGB);
    event StorageRented(uint256 indexed spaceId, address indexed renter, uint256 rentedSpace, uint256 duration);
    event FileUploaded(uint256 indexed spaceId, address indexed renter, string fileHash);

    constructor() {
        nextStorageId = 1;
    }

    function addStorageSpace(uint256 totalSpace, uint256 pricePerGB) external {
        storageSpaces[nextStorageId] = StorageSpace({
            totalSpace: totalSpace,
            availableSpace: totalSpace,
            pricePerGB: pricePerGB,
            owner: msg.sender
        });
        
        emit StorageAdded(nextStorageId, totalSpace, pricePerGB);
        nextStorageId++;
    }

    function rentStorage(uint256 spaceId, uint256 spaceToRent, uint256 durationInDays) external payable {
        StorageSpace storage space = storageSpaces[spaceId];
        require(space.availableSpace >= spaceToRent, "Not enough available space");
        
        uint256 totalCost = space.pricePerGB * spaceToRent * durationInDays;
        require(msg.value >= totalCost, "Insufficient payment");

        // Update available space
        space.availableSpace -= spaceToRent;

        // Create new rental
        Rental memory newRental = Rental({
            spaceId: spaceId,
            rentedSpace: spaceToRent,
            rentedUntil: block.timestamp + (durationInDays * 1 days),
            isActive: true
        });

        userRentals[msg.sender].push(newRental);

        emit StorageRented(spaceId, msg.sender, spaceToRent, durationInDays);
    }

    function uploadFile(uint256 spaceId, string calldata fileHash) external {
        bool hasValidRental = false;
        Rental[] storage rentals = userRentals[msg.sender];
        
        for (uint i = 0; i < rentals.length; i++) {
            if (rentals[i].spaceId == spaceId && 
                rentals[i].isActive && 
                block.timestamp < rentals[i].rentedUntil) {
                hasValidRental = true;
                break;
            }
        }
        
        require(hasValidRental, "No valid rental found for this space");
        emit FileUploaded(spaceId, msg.sender, fileHash);
    }

    function getUserRentals(address user) external view returns (Rental[] memory) {
        return userRentals[user];
    }

    function getStorageSpace(uint256 spaceId) external view returns (
        uint256 totalSpace,
        uint256 availableSpace,
        uint256 pricePerGB,
        address owner
    ) {
        StorageSpace storage space = storageSpaces[spaceId];
        return (
            space.totalSpace,
            space.availableSpace,
            space.pricePerGB,
            space.owner
        );
    }
}