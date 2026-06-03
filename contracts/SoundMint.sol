// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoundMint is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct AudioTraits {
        uint16 bpm;
        uint8  dominantKey;
        uint8  energyLevel;   // 0-255 normalized
        uint8  brightness;    // 0-255 normalized
        string genre;
    }

    mapping(uint256 => string)       public tokenURIs;
    mapping(uint256 => AudioTraits)  public tokenTraits;

    uint256 public mintPrice = 0.01 ether;

    event Minted(address indexed to, uint256 tokenId, string ipfsURI);

    constructor() ERC721("SoundMint", "SNDM") Ownable(msg.sender) {}

    function mint(address to, string calldata ipfsURI, AudioTraits calldata traits) external payable returns (uint256)
    {
        require(msg.value >= mintPrice, "Insufficient ETH");

        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
        tokenURIs[tokenId]  = ipfsURI;
        tokenTraits[tokenId] = traits;

        emit Minted(to, tokenId, ipfsURI);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return tokenURIs[tokenId];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
